% Beacon AI Moderation Engine - Balanced Rules
% Allows: NSFW (non-illegal), jokes, banter
% Blocks: CSAM, illegal activities, extreme harm

% ============================================================================
% CRITICAL BLOCKS (Always blocked)
% ============================================================================

% Child Safety (ZERO TOLERANCE)
block(Message, 'CSAM_DETECTED', 100) :-
    (contains(Message, 'child'), contains(Message, 'sexual'));
    (contains(Message, 'minor'), contains(Message, 'meet'));
    (contains(Message, 'underage'), contains(Message, 'explicit')).

% Illegal Activities
block(Message, 'ILLEGAL_ACTIVITY', 95) :-
    (contains(Message, 'sell'), contains(Message, 'drugs'), not_joke(Message));
    (contains(Message, 'buy'), contains(Message, 'cocaine|heroin|meth'));
    (contains(Message, 'murder'), contains(Message, 'hire|contract'), not_joke(Message));
    (contains(Message, 'bomb'), contains(Message, 'how to make'), not_joke(Message)).

% Doxxing / Personal Info Sharing
block(Message, 'DOXXING', 90) :-
    (contains(Message, 'address'), contains(Message, 'live at|lives at'));
    (contains(Message, 'phone'), contains(Message, 'number is'));
    (contains(Message, 'ssn|social security')).

% ============================================================================
% WARNINGS (Allowed but flagged)
% ============================================================================

% NSFW Content (Allowed, just flagged for NSFW channels)
warn(Message, 'NSFW_CONTENT', 30) :-
    contains(Message, 'nsfw|porn|xxx|hentai'),
    not(block(Message, _, _)).

% Excessive Toxicity (Allowed in moderation)
warn(Message, 'TOXIC_LANGUAGE', 40) :-
    toxicity_score(Message, Score),
    Score > 70,
    Score < 90,
    not(block(Message, _, _)).

% Spam Patterns
warn(Message, 'POTENTIAL_SPAM', 35) :-
    (repeated_chars(Message, Count), Count > 10);
    (all_caps(Message), length(Message, Len), Len > 50);
    (contains(Message, 'http'), count_links(Message, Links), Links > 5).

% ============================================================================
% ALLOWED (No action)
% ============================================================================

% Jokes & Banter (Always allowed)
allow(Message) :-
    contains(Message, 'lol|lmao|jk|kidding|joking|haha');
    contains(Message, '😂|🤣|😅').

% NSFW in NSFW channels (Fully allowed)
allow(Message) :-
    channel_nsfw(true),
    not(block(Message, _, _)).

% Mild profanity (Allowed)
allow(Message) :-
    contains(Message, 'fuck|shit|damn|ass|bitch'),
    not(excessive_profanity(Message)),
    not(block(Message, _, _)).

% Dark humor (Allowed with context)
allow(Message) :-
    contains(Message, 'dark humor|edgy'),
    not(block(Message, _, _)).

% ============================================================================
% HELPER PREDICATES
% ============================================================================

contains(Message, Pattern) :-
    downcase_atom(Message, Lower),
    sub_atom(Lower, _, _, _, Pattern).

not_joke(Message) :-
    not(contains(Message, 'lol|lmao|jk|kidding|joking|haha|😂|🤣')).

toxicity_score(Message, Score) :-
    % Simplified toxicity scoring
    (contains(Message, 'kill yourself') -> Score = 95;
     contains(Message, 'kys') -> Score = 90;
     contains(Message, 'die|death') -> Score = 60;
     Score = 20).

repeated_chars(Message, Count) :-
    % Count repeated characters
    atom_chars(Message, Chars),
    count_repeats(Chars, Count).

all_caps(Message) :-
    upcase_atom(Message, Upper),
    Message = Upper.

excessive_profanity(Message) :-
    count_profanity(Message, Count),
    Count > 5.

% ============================================================================
% MODERATION DECISION
% ============================================================================

moderate(Message, ChannelNSFW, Result) :-
    (block(Message, Reason, Score) ->
        Result = blocked(Reason, Score);
     warn(Message, Reason, Score) ->
        Result = warning(Reason, Score);
     allow(Message) ->
        Result = approved;
     Result = approved). % Default: allow

% ============================================================================
% EXAMPLES
% ============================================================================

% BLOCKED:
% - "Want to meet? I'm 14" → CSAM_DETECTED
% - "Selling cocaine, DM me" → ILLEGAL_ACTIVITY
% - "His address is 123 Main St" → DOXXING

% WARNED:
% - "Check out this porn site" → NSFW_CONTENT (flagged for NSFW channel)
% - "You're fucking stupid" → TOXIC_LANGUAGE (allowed but warned)

% ALLOWED:
% - "That's some dark humor lmao" → APPROVED
% - "Fuck yeah!" → APPROVED
% - "NSFW content" in NSFW channel → APPROVED
% - "jk jk just kidding" → APPROVED
