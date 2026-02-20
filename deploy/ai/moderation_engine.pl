% Beacon AI Moderation Engine
% SWI-Prolog 10.0+ Rule-Based Content Moderation
% Philosophy: Allow freedom of expression, block actual harm

:- module(moderation_engine, [
    analyze_message/3,
    analyze_context/4,
    get_threat_level/2,
    should_flag/2
]).

:- use_module(library(pcre)).
:- use_module(library(lists)).

% ============================================================================
% CORE PHILOSOPHY: Context-Aware, Human-Centric Moderation
% ============================================================================
% ALLOWED:
%   - Swearing, crude language, dark humor
%   - Jokes about illegal activities
%   - Educational discussions about sensitive topics
%   - Memes, satire, sarcasm
%   - Heated debates (as long as no credible threats)
%
% PROHIBITED (automatic flag):
%   - Actual planning/coordination of illegal activities
%   - Real drug selling/trafficking (not jokes)
%   - Child sexual exploitation material (CSAM)
%   - Credible threats of violence/terrorism
%   - Doxxing, sharing personal info maliciously
% ============================================================================

% Threat levels: safe, low, medium, high, critical
% safe: No action needed
% low: Log for review, no action
% medium: Warn user, log
% high: Auto-delete, temp mute, notify mods
% critical: Auto-ban, preserve evidence, notify admins

% ============================================================================
% PATTERN MATCHING - CRITICAL VIOLATIONS
% ============================================================================

% CSAM Indicators (CRITICAL - Zero Tolerance)
csam_pattern('\\b(cp|cheese pizza)\\b.*\\b(trade|sell|buy|want|looking for)\\b').
csam_pattern('\\b(pedo|paedo)\\b.*\\b(discord|telegram|wickr|session)\\b').
csam_pattern('\\b(young|teen|child)\\b.*\\b(nude|naked|explicit|porn)\\b.*\\b(sell|buy|trade)\\b').
csam_pattern('jailbait.*\\b(collection|archive|mega|drive)\\b').

% Drug Trafficking (not jokes - actual selling)
drug_selling_pattern('\\b(sell|selling|dealing)\\b.*\\b(meth|heroin|fentanyl|cocaine|mdma|lsd)\\b.*\\b(dm me|telegram|whatsapp|contact)\\b').
drug_selling_pattern('\\b(vendor|plug|connect)\\b.*\\b(oz|gram|kilo)\\b.*\\b(\\$|price|contact)\\b').
drug_selling_pattern('\\b(shop|store|menu)\\b.*\\b(weed|molly|coke|pills)\\b.*\\b(shipping|delivery|escrow)\\b').

% Credible Violence/Terror Planning
violence_planning_pattern('\\b(shoot|bomb|attack)\\b.*\\b(school|mall|church|synagogue|mosque)\\b.*\\b(tomorrow|next week|planning)\\b').
violence_planning_pattern('\\b(kill|murder|assassinate)\\b.*\\b(real name|address|location)\\b.*\\b(soon|tonight|this week)\\b').
violence_planning_pattern('\\b(pipe bomb|explosive|ied)\\b.*\\b(instructions|tutorial|guide)\\b.*\\b(materials|supplies)\\b').

% Doxxing
doxxing_pattern('\\b(real address|home address|phone number)\\b.*\\b(is|lives at)\\b').
doxxing_pattern('\\b(ssn|social security|credit card)\\b.*\\b(\\d{3}-\\d{2}-\\d{4}|\\d{4}-\\d{4}-\\d{4}-\\d{4})\\b').

% ============================================================================
% CONTEXT INDICATORS - Not violations, but increase suspicion
% ============================================================================

% These are NOT automatic flags, but raise threat level in context
selling_indicator('\\b(dm for price|contact me|telegram|wickr|session ID)\\b').
transaction_indicator('\\b(cash|crypto|bitcoin|monero|paypal|venmo)\\b.*\\b(only|payment)\\b').
urgency_indicator('\\b(urgent|asap|quick|now|limited time)\\b').
location_specific('\\b(near|local|area code|zip code|city)\\b.*\\b(delivery|meetup|drop)\\b').

% ============================================================================
% SAFE PATTERNS - Explicitly mark as humor/satire
% ============================================================================

safe_humor_marker('\\b(jk|joking|lmao|lol|haha|just kidding|sarcasm|meme)\\b').
safe_humor_marker('\\bimagine\\b.*\\bif\\b').
safe_humor_marker('\\bhypothetically\\b').
safe_humor_marker('\\bin minecraft\\b'). % Common meme deflection

% ============================================================================
% MAIN ANALYSIS PREDICATE
% ============================================================================

analyze_message(MessageText, UserId, Result) :-
    downcase_atom(MessageText, LowerText),
    atom_string(LowerText, LowerString),
    analyze_content(LowerString, ThreatLevel, Reasons, Evidence),
    get_user_history_modifier(UserId, HistoryMod),
    adjust_threat_level(ThreatLevel, HistoryMod, FinalThreat),
    Result = _{
        threat_level: FinalThreat,
        reasons: Reasons,
        evidence: Evidence,
        action: Action,
        confidence: Confidence
    },
    determine_action(FinalThreat, Action, Confidence).

% Analyze message content
analyze_content(Text, ThreatLevel, Reasons, Evidence) :-
    findall(Reason-Evid, check_violation(Text, Reason, Evid), Violations),
    ( Violations = [] ->
        ThreatLevel = safe,
        Reasons = [],
        Evidence = []
    ;
        separate_violations(Violations, Reasons, Evidence),
        calculate_threat_level(Reasons, ThreatLevel)
    ).

% Check for violations
check_violation(Text, csam, Evidence) :-
    csam_pattern(Pattern),
    re_match(Pattern, Text, []),
    re_matchsub(Pattern, Text, Match, []),
    Evidence = Match.0.

check_violation(Text, drug_selling, Evidence) :-
    drug_selling_pattern(Pattern),
    re_match(Pattern, Text, []),
    \+ has_humor_marker(Text), % Not a joke
    re_matchsub(Pattern, Text, Match, []),
    Evidence = Match.0.

check_violation(Text, violence_planning, Evidence) :-
    violence_planning_pattern(Pattern),
    re_match(Pattern, Text, []),
    \+ has_humor_marker(Text),
    re_matchsub(Pattern, Text, Match, []),
    Evidence = Match.0.

check_violation(Text, doxxing, Evidence) :-
    doxxing_pattern(Pattern),
    re_match(Pattern, Text, []),
    re_matchsub(Pattern, Text, Match, []),
    Evidence = Match.0.

% Check if message has humor markers
has_humor_marker(Text) :-
    safe_humor_marker(Pattern),
    re_match(Pattern, Text, []).

% Calculate threat level from reasons
calculate_threat_level(Reasons, critical) :-
    (member(csam, Reasons) ; member(violence_planning, Reasons)), !.
calculate_threat_level(Reasons, high) :-
    (member(drug_selling, Reasons) ; member(doxxing, Reasons)), !.
calculate_threat_level(Reasons, medium) :-
    length(Reasons, L), L >= 2, !.
calculate_threat_level(_, low).

% Determine action based on threat level
determine_action(critical, auto_ban, 99) :- !.
determine_action(high, auto_delete_and_mute, 95) :- !.
determine_action(medium, warn_and_log, 75) :- !.
determine_action(low, log_only, 50) :- !.
determine_action(safe, none, 0).

% ============================================================================
% CONTEXT ANALYSIS - Multi-message evaluation
% ============================================================================

analyze_context(Messages, UserId, ChannelId, ContextResult) :-
    length(Messages, MsgCount),
    analyze_message_sequence(Messages, SequencePatterns),
    get_user_pattern(UserId, UserPattern),
    get_channel_context(ChannelId, ChannelContext),
    combine_context_factors(SequencePatterns, UserPattern, ChannelContext, ThreatScore),
    ContextResult = _{
        message_count: MsgCount,
        threat_score: ThreatScore,
        patterns: SequencePatterns,
        recommendation: Recommendation
    },
    recommend_action(ThreatScore, Recommendation).

analyze_message_sequence(Messages, Patterns) :-
    findall(Pattern, detect_sequence_pattern(Messages, Pattern), Patterns).

% Detect patterns across multiple messages
detect_sequence_pattern(Messages, escalating_aggression) :-
    get_aggression_scores(Messages, Scores),
    is_escalating(Scores).

detect_sequence_pattern(Messages, repeated_selling) :-
    count_selling_indicators(Messages, Count),
    Count >= 3.

detect_sequence_pattern(Messages, coordinated_attack) :-
    count_similar_messages(Messages, SimilarCount),
    SimilarCount >= 5.

% User history modifier (-2 to +2)
get_user_history_modifier(UserId, Modifier) :-
    % TODO: Integrate with database
    % Good standing users get -1 (more lenient)
    % New users get 0
    % Previously warned users get +1
    Modifier = 0.

get_user_pattern(UserId, Pattern) :-
    % TODO: Machine learning user behavior analysis
    Pattern = _{
        avg_messages_per_day: 50,
        violation_history: 0,
        reputation_score: 100
    }.

get_channel_context(ChannelId, Context) :-
    % TODO: Get channel metadata
    Context = _{
        nsfw: false,
        moderated: true,
        member_count: 100
    }.

adjust_threat_level(Level, Modifier, Level) :- Modifier = 0, !.
adjust_threat_level(critical, _, critical) :- !. % Critical never downgraded
adjust_threat_level(high, Modifier, medium) :- Modifier < -1, !.
adjust_threat_level(medium, Modifier, low) :- Modifier < -1, !.
adjust_threat_level(Level, _, Level).

combine_context_factors(_, _, _, 0). % Placeholder

recommend_action(Score, immediate_ban) :- Score >= 90, !.
recommend_action(Score, review_required) :- Score >= 70, !.
recommend_action(Score, monitor) :- Score >= 40, !.
recommend_action(_, none).

% ============================================================================
% UTILITY PREDICATES
% ============================================================================

separate_violations([], [], []).
separate_violations([R-E|Rest], [R|Reasons], [E|Evidence]) :-
    separate_violations(Rest, Reasons, Evidence).

get_threat_level(Text, Level) :-
    analyze_message(Text, 'unknown', Result),
    Level = Result.threat_level.

should_flag(Text, true) :-
    get_threat_level(Text, Level),
    member(Level, [medium, high, critical]), !.
should_flag(_, false).

% Placeholder implementations for referenced predicates
get_aggression_scores(_, [0]).
is_escalating(_) :- fail.
count_selling_indicators(_, 0).
count_similar_messages(_, 0).

% Export for Node.js integration
:- use_module(library(http/json)).

% JSON API endpoint
analyze_message_json(JsonIn, JsonOut) :-
    atom_string(JsonIn, JsonString),
    atom_json_dict(JsonString, Input, []),
    analyze_message(Input.message, Input.user_id, Result),
    atom_json_dict(JsonOut, Result, []).
