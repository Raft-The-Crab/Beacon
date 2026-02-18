% moderation.pl

% Predicate to moderate text
% moderate_text(+Text, +Type, +Context, -ResultJSON)
% Text: The input string to moderate.
% Type: The type of content ('text' or 'image').
% Context: A Prolog term representing the parsed JSON context object.
% ResultJSON: A JSON string representing the moderation result.

:- use_module(library(clpfd)).
:- use_module(library(dcg/basics)).
:- use_module(library(uri)).
:- use_module(library(thread)).
:- use_module(library(ssl)).
:- use_module(library(http/json)). % For JSON output

% --- Configuration ---
% Define thresholds for moderation. A higher score means more likely to be prohibited.
prohibited_threshold(0.7).
warning_threshold(0.4).

% --- Helper Predicates ---

% Case-insensitive substring check
has_keyword(Text, Keyword) :-
    downcase_atom(Text, LowerText),
    sub_atom(LowerText, _, _, _, Keyword).

% Get value from JSON context
get_context_value(Context, Key, Value) :-
    (   is_dict(Context)
    ->  get_dict(Key, Context, Value)
    ;   % Handle non-dict context gracefully, e.g., if context is null or not an object
        fail
    ).

% --- Rule-based Moderation ---

% Rules for prohibited content (higher scores)
% Each rule adds flags and contributes to the total score.
moderation_rule(Text, _Type, _Context, 'CHILD_EXPLOITATION', 1.0) :- has_keyword(Text, 'child porn').
moderation_rule(Text, _Type, _Context, 'CHILD_EXPLOITATION', 1.0) :- has_keyword(Text, 'cp content').
moderation_rule(Text, _Type, _Context, 'REAL_ILLEGAL_COORDINATION', 0.9) :- has_keyword(Text, 'plan attack').
moderation_rule(Text, _Type, _Context, 'REAL_ILLEGAL_COORDINATION', 0.9) :- has_keyword(Text, 'smuggle drugs').
moderation_rule(Text, _Type, _Context, 'DRUG_SELLING', 0.8) :- has_keyword(Text, 'buy coke').
moderation_rule(Text, _Type, _Context, 'DRUG_SELLING', 0.8) :- has_keyword(Text, 'sell heroin').
moderation_rule(Text, _Type, _Context, 'TERRORISM_SUPPORT', 0.9) :- has_keyword(Text, 'jihad now').
moderation_rule(Text, _Type, _Context, 'TERRORISM_SUPPORT', 0.9) :- has_keyword(Text, 'bombing tutorial').
moderation_rule(Text, _Type, _Context, 'CREDIBLE_THREATS', 0.8) :- has_keyword(Text, 'kill you').
moderation_rule(Text, _Type, _Context, 'CREDIBLE_THREATS', 0.8) :- has_keyword(Text, 'shoot up school').

% Rules for general warning (medium scores) - can be overridden by allowed categories
moderation_rule(Text, _Type, _Context, 'HATE_SPEECH', 0.6) :- has_keyword(Text, 'racial slur').
moderation_rule(Text, _Type, _Context, 'HATE_SPEECH', 0.6) :- has_keyword(Text, 'ethnic cleansing').

% --- Context-Aware Rules (Example) ---
% If the message is from a 'trusted' user, reduce the score.
moderation_rule(Text, _Type, Context, 'TRUSTED_USER_MODIFICATION', -0.5) :-
    get_context_value(Context, userRole, 'admin'), % Assuming 'admin' is a role in context
    has_keyword(Text, 'mild nsfw'). % Only for specific types of content

% --- Allowed Content (reduces score or prevents flagging) ---
is_allowed_context(Text, _Type, _Context) :- has_keyword(Text, 'joke about drugs').
is_allowed_context(Text, _Type, _Context) :- has_keyword(Text, 'dark humor about').
is_allowed_context(Text, _Type, _Context) :- has_keyword(Text, 'educational discussion').


% --- Main Moderation Logic ---

% aggregate_scores(+Text, +Type, +Context, -Flags, -TotalScore)
aggregate_scores(Text, Type, Context, Flags, TotalScore) :-
    findall(Flag-Score, moderation_rule(Text, Type, Context, Flag, Score), AllRules),
    aggregate_flags_and_score(AllRules, [], 0.0, Flags, TotalScore).

% Recursive aggregation
aggregate_flags_and_score([], AccFlags, AccScore, AccFlags, AccScore).
aggregate_flags_and_score([Flag-Score|Rest], CurrentFlags, CurrentScore, FinalFlags, FinalScore) :-
    (   \+ member(Flag, CurrentFlags)
    ->  NewFlags = [Flag|CurrentFlags]
    ;   NewFlags = CurrentFlags
    ),
    NewScore is CurrentScore + Score,
    aggregate_flags_and_score(Rest, NewFlags, NewScore, FinalFlags, FinalScore).


% moderate_text(+Text, +Type, +Context, -ResultJSON)
moderate_text(Text, Type, Context, ResultJSON) :-
    aggregate_scores(Text, Type, Context, RawFlags, RawScore),
    
    (   is_allowed_context(Text, Type, Context)
    ->  FinalScore is RawScore * 0.2, % Reduce score significantly if in allowed context
        FilteredFlags = [] % Clear flags if allowed context is strong
    ;   FinalScore = RawScore,
        FilteredFlags = RawFlags
    ),

    prohibited_threshold(ProhibitedT),
    warning_threshold(WarningT),

    (   FinalScore >= ProhibitedT
    ->  Approved = false,
        Status = 'Prohibited'
    ;   FinalScore >= WarningT
    ->  Approved = true, % Still approved, but flagged for warning
        Status = 'Warning'
    ;   Approved = true,
        Status = 'Approved'
    ),

    % Construct the result as a Prolog term
    ResultTerm = json([
        flags=FilteredFlags,
        score=FinalScore,
        approved=Approved,
        status=Status % Added for better reporting
    ]),
    % Convert the Prolog term to a JSON string
    with_output_to(atom(ResultJSON), json_write(current_output, ResultTerm)).

% Predicate to read a line from stdin, parse JSON, moderate it, and write result to stdout
run_moderation_loop :-
    repeat,
    read_line_to_string(current_input, LineString),
    (   LineString == end_of_file
    ->  !
    ;   % Parse the incoming JSON payload
        setup_call_cleanup(
            open_string(LineString, Stream),
            json_read_dict(Stream, JsonData),
            close(Stream)
        ),
        
        get_dict(content, JsonData, Content),
        get_dict(type, JsonData, Type),
        % Get context, default to an empty dict if not present
        (   get_dict(context, JsonData, Context)
        ->  true
        ;   Context = json([]) % Default to empty JSON object if context is missing
        ),
        
        moderate_text(Content, Type, Context, ResultJSON),
        writeln(ResultJSON),
        flush_output
    ).

% To run this from command line: swipl -q -l moderation.pl -g run_moderation_loop
