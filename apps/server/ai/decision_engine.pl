% Beacon AI Decision Engine
% Prolog-based moderation decision making

:- use_module(library(http/json)).
:- use_module(library(readutil)).

% Main decision loop
run_decision_loop :-
    repeat,
    read_line_to_string(user_input, Line),
    (   Line == end_of_file
    ->  !
    ;   process_decision(Line),
        fail
    ).

% Process incoming decision request
process_decision(JsonString) :-
    json_read_dict(JsonString, Query),
    make_moderation_decision(Query, Decision),
    json_write_dict(user_output, Decision),
    writeln(""),
    flush_output.

% Core moderation decision logic
make_moderation_decision(Query, Decision) :-
    get_dict(illegal_score, Query, IllegalScore),
    get_dict(categories, Query, Categories),
    get_dict(confidence, Query, Confidence),
    get_dict(context, Query, Context),
    
    % Determine action based on Beacon's rules: only block illegal content
    determine_action(IllegalScore, Categories, Confidence, Context, Action),
    
    % Create decision response
    Decision = _{
        action: Action,
        confidence: Confidence,
        reason: "Beacon allows everything except illegal activities",
        timestamp: "now"
    }.

% Decision rules - only block actual illegal content
determine_action(_, Categories, Confidence, _, "block") :-
    (member("csam", Categories) ; member("illegal", Categories)),
    Confidence > 0.7,
    !.

determine_action(IllegalScore, Categories, Confidence, _, "flag") :-
    IllegalScore > 0.6,
    (member("csam", Categories) ; member("illegal", Categories)),
    Confidence > 0.5,
    !.

% Default action - allow everything else (toxicity, jokes, etc.)
determine_action(_, _, _, _, "allow").

% Helper predicates
member(X, [X|_]).
member(X, [_|T]) :- member(X, T).

% Utility for getting dictionary values with defaults
get_dict(Key, Dict, Value, Default) :-
    (   get_dict(Key, Dict, Value)
    ->  true
    ;   Value = Default
    ).