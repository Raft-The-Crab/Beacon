/**
 * Beacon Moderation Rules Engine — SWI-Prolog
 *
 * POLICY:
 *   Block only: CSAM and direct illegal activity coordination.
 *   Allow:  drug humor, dark humor, self-harm support talk, threats as venting/jokes,
 *           profanity, toxicity, adult content debates — all of these are permitted.
 *   Platform-level NSFW (images/video) is handled separately by nsfwjs.
 *
 * Architecture:
 *   Runs as a persistent subprocess managed by the Node.js PrologBridge.
 *   Reads newline-delimited JSON from stdin; writes newline-delimited JSON to stdout.
 *   Entry goal: run_moderation_loop/0
 *
 * Severity tiers: safe → low → medium → high → critical
 * Actions:        none → warning → account_risk_flag → escalate → immediate_ban_and_ip_ban
 */

:- module(beacon_moderation, [run_moderation_loop/0]).
:- use_module(library(http/json)).

% ─────────────────────────────────────────────────────────────────────────────
% CSAM phrases — ABSOLUTE BLOCK, no safe-context bypass ever.
% ─────────────────────────────────────────────────────────────────────────────

csam_phrase("child pornography").
csam_phrase("cp collection").
csam_phrase("cp trade").
csam_phrase("loli trade").
csam_phrase("underage explicit").
csam_phrase("minor explicit").
csam_phrase("csam").
csam_phrase("pedo trade").
csam_phrase("selling child").
csam_phrase("minor pornography").
csam_phrase("child sexual abuse").
csam_phrase("cp server").
csam_phrase("kiddie porn").

% ─────────────────────────────────────────────────────────────────────────────
% Hard drug trafficking — operational coordination phrases only.
% Casual mentions ("I used drugs", "lol drugs"), harm reduction, and jokes
% are explicitly allowed. Only actual supply-chain coordination is blocked.
% Safe-context can bypass this (e.g. educational, research, news).
% ─────────────────────────────────────────────────────────────────────────────

drug_coord_phrase("fentanyl vendor").
drug_coord_phrase("selling fentanyl").
drug_coord_phrase("heroin vendor").
drug_coord_phrase("meth vendor").
drug_coord_phrase("cocaine shop").
drug_coord_phrase("selling heroin").
drug_coord_phrase("ship drugs to").
drug_coord_phrase("drug delivery service").
drug_coord_phrase("darknet drug shop").
drug_coord_phrase("dark web drug vendor").
drug_coord_phrase("buy fentanyl online").
drug_coord_phrase("order cocaine online").

% ─────────────────────────────────────────────────────────────────────────────
% Doxxing — direct exposure of real PII with malicious context.
% General privacy discussion, data breach news, and research are allowed.
% ─────────────────────────────────────────────────────────────────────────────

doxx_phrase("dox drop").
doxx_phrase("full dox of").
doxx_phrase("here is their home address").
doxx_phrase("leaked ssn").
doxx_phrase("posting their real address").
doxx_phrase("doxxing them now").
doxx_phrase("credit card dump").

% ─────────────────────────────────────────────────────────────────────────────
% Safe context markers
% Jokes, education, roleplay, venting, humor — these bypass drug/doxx rules.
% ─────────────────────────────────────────────────────────────────────────────

safe_marker("jk").
safe_marker("just kidding").
safe_marker("lmao").
safe_marker("lol").
safe_marker("haha").
safe_marker("joking").
safe_marker("in minecraft").
safe_marker("hypothetically").
safe_marker("educational").
safe_marker("for school").
safe_marker("research").
safe_marker("news article").
safe_marker("harm reduction").
safe_marker("roleplay").
safe_marker(" rp ").
safe_marker("meme").
safe_marker("dark humor").
safe_marker("copypasta").

% ─────────────────────────────────────────────────────────────────────────────
% Utility predicates
% ─────────────────────────────────────────────────────────────────────────────

contains_lower(Text, Pattern) :-
    string_lower(Text, Lower),
    sub_string(Lower, _, _, _, Pattern).

has_safe_context(Text) :-
    safe_marker(M), contains_lower(Text, M), !.

% ─────────────────────────────────────────────────────────────────────────────
% Classification rules — ordered by severity, first match wins.
%
% classify(+Text, +PriorOffenses, -Severity, -Reason, -Action, -Description)
% ─────────────────────────────────────────────────────────────────────────────

% CSAM — absolute block, safe context NEVER bypasses this.
classify(Text, _, critical, csam, immediate_ban_and_ip_ban,
         "CSAM content detected. Immediate permanent action required.") :-
    csam_phrase(P), contains_lower(Text, P), !.

% Drug trafficking coordination — blocked unless safe context is present.
classify(Text, _, critical, drug_trafficking, immediate_ban_and_ip_ban,
         "Operational drug trafficking coordination detected.") :-
    \+ has_safe_context(Text),
    drug_coord_phrase(P), contains_lower(Text, P), !.

% Malicious doxxing — escalates with prior offenses.
classify(Text, Prior, Severity, doxxing, Action, Desc) :-
    \+ has_safe_context(Text),
    doxx_phrase(P), contains_lower(Text, P), !,
    (   Prior >= 2
    ->  Severity = critical,
        Action   = immediate_ban_and_ip_ban,
        Desc     = "Repeated doxxing violations — permanent ban."
    ;   Severity = high,
        Action   = escalate,
        Desc     = "Malicious PII exposure — escalated for human review."
    ).

% Default — everything else is safe (drugs-as-topic, toxicity, self-harm
% discussion, dark humor, adult content, etc. are all permitted).
classify(_, _, safe, none, none, "Content passed all moderation rules.").

% ─────────────────────────────────────────────────────────────────────────────
% Result output
% ─────────────────────────────────────────────────────────────────────────────

approved_flag(safe, @(true)).
approved_flag(low,  @(true)).
approved_flag(_,    @(false)).

write_result(Severity, Reason, Action, Desc, Prior) :-
    approved_flag(Severity, Approved),
    atom_string(Severity, SevS),
    atom_string(Reason,   ResS),
    atom_string(Action,   ActS),
    (atom(Desc) -> atom_string(Desc, DescS) ; DescS = Desc),
    Dict = json{
        severity:      SevS,
        reason:        ResS,
        action:        ActS,
        description:   DescS,
        approved:      Approved,
        priorOffenses: Prior
    },
    json_write_dict(current_output, Dict, []),
    nl,
    flush_output.

write_error_result :-
    writeln('{"severity":"safe","reason":"parse_error","action":"none","approved":true,"priorOffenses":0,"description":"Request parse error — defaulting to safe."}'),
    flush_output.

% ─────────────────────────────────────────────────────────────────────────────
% Integer coercion
% ─────────────────────────────────────────────────────────────────────────────

coerce_int(N, N) :- integer(N), !.
coerce_int(F, N) :- float(F), !, N is round(F).
coerce_int(A, N) :- atom(A), atom_number(A, F), !, N is round(F).
coerce_int(_, 0).

% ─────────────────────────────────────────────────────────────────────────────
% Main event loop
% ─────────────────────────────────────────────────────────────────────────────

run_moderation_loop :-
    repeat,
        read_line_to_string(user_input, Line),
        (   Line == end_of_file
        ->  !
        ;   process_line(Line),
            fail
        ).

process_line(Line) :-
    (   catch(atom_json_dict(Line, Request, []), _, fail)
    ->  ( get_dict(content,       Request, Content) -> true ; Content = "" ),
        ( get_dict(priorOffenses, Request, P0)      -> true ; P0 = 0 ),
        coerce_int(P0, Prior),
        classify(Content, Prior, Severity, Reason, Action, Desc),
        write_result(Severity, Reason, Action, Desc, Prior)
    ;   write_error_result
    ).
 *
 * Architecture:
 *   Runs as a persistent subprocess managed by the Node.js PrologBridge.
 *   Reads newline-delimited JSON from stdin, writes newline-delimited JSON to stdout.
 *   Entry goal: run_moderation_loop/0
 *
 * Pipeline:
 *   Each request: parse JSON → classify/6 → write JSON result
 *
 * Severity tiers: safe → low → medium → high → critical
 * Actions:        none → warning → account_risk_flag → escalate → immediate_ban_and_ip_ban
 */

:- module(beacon_moderation, [run_moderation_loop/0]).
:- use_module(library(http/json)).

% ─────────────────────────────────────────────────────────────────────────────
% CSAM phrases
% These always trigger critical regardless of safe-context markers.
% ─────────────────────────────────────────────────────────────────────────────

csam_phrase("child pornography").
csam_phrase("cp collection").
csam_phrase("cp trade").
csam_phrase("loli trade").
csam_phrase("underage explicit").
csam_phrase("minor explicit").
csam_phrase("csam").
csam_phrase("pedo trade").
csam_phrase("selling child").
csam_phrase("minor meet").

% ─────────────────────────────────────────────────────────────────────────────
% Hard drug trafficking phrases
% Bypassed when a safe-context marker is present (e.g. "educational").
% ─────────────────────────────────────────────────────────────────────────────

drug_phrase("fentanyl vendor").
drug_phrase("selling fentanyl").
drug_phrase("heroin vendor").
drug_phrase("meth vendor").
drug_phrase("cocaine shop").
drug_phrase("selling heroin").
drug_phrase("buying fentanyl").
drug_phrase("dark web drugs").
drug_phrase("darknet drugs").
drug_phrase("ship drugs").

% ─────────────────────────────────────────────────────────────────────────────
% Doxxing / PII exposure phrases
% ─────────────────────────────────────────────────────────────────────────────

doxx_phrase("real address is").
doxx_phrase("leaked passport").
doxx_phrase("credit card leak").
doxx_phrase("credit card number").
doxx_phrase("social security number").
doxx_phrase("ssn leak").
doxx_phrase("dox drop").
doxx_phrase("full dox").
doxx_phrase("home address leak").

% ─────────────────────────────────────────────────────────────────────────────
% Credible threat phrases
% ─────────────────────────────────────────────────────────────────────────────

threat_phrase("i will kill").
threat_phrase("i will shoot").
threat_phrase("going to murder").
threat_phrase("going to shoot").
threat_phrase("going to bomb").
threat_phrase("will blow up").
threat_phrase("i'll kill you").
threat_phrase("shoot up the").

% ─────────────────────────────────────────────────────────────────────────────
% Self-harm coordination phrases
% ─────────────────────────────────────────────────────────────────────────────

selfharm_phrase("method to kill yourself").
selfharm_phrase("painless suicide").
selfharm_phrase("suicide methods").
selfharm_phrase("how to end it all").
selfharm_phrase("lethal dose of").

% ─────────────────────────────────────────────────────────────────────────────
% Spam / raid coordination phrases
% ─────────────────────────────────────────────────────────────────────────────

spam_phrase("raid this server").
spam_phrase("raid discord").
spam_phrase("mass dm bot").
spam_phrase("token grabber").
spam_phrase("nuke the server").

% ─────────────────────────────────────────────────────────────────────────────
% Safe context markers
% When present, bypass medium/low rules (but NOT CSAM which is always blocked).
% ─────────────────────────────────────────────────────────────────────────────

safe_marker("jk").
safe_marker("just kidding").
safe_marker("lmao").
safe_marker("lol").
safe_marker("haha").
safe_marker("joking").
safe_marker("jokingly").
safe_marker("in minecraft").
safe_marker("hypothetically").
safe_marker("educational").
safe_marker("for school").
safe_marker("history class").
safe_marker("studying").
safe_marker("research").
safe_marker("roleplay").
safe_marker(" rp ").
safe_marker("meme").
safe_marker("copypasta").
safe_marker("dark humor").
safe_marker("fr fr").
safe_marker("bruh").
safe_marker("imagine").
safe_marker("💀").
safe_marker("😂").
safe_marker("😭").

% ─────────────────────────────────────────────────────────────────────────────
% Utility predicates
% ─────────────────────────────────────────────────────────────────────────────

%% contains_lower(+Text:string, +Pattern:string) is semidet.
%  True if Pattern appears in the lowercase form of Text.
contains_lower(Text, Pattern) :-
    string_lower(Text, Lower),
    sub_string(Lower, _, _, _, Pattern).

%% has_safe_context(+Text:string) is semidet.
%  True if Text contains at least one safe-context marker.
has_safe_context(Text) :-
    safe_marker(M), contains_lower(Text, M), !.

% ─────────────────────────────────────────────────────────────────────────────
% Classification rules
%
% classify(+Text, +PriorOffenses, -Severity, -Reason, -Action, -Description)
%
% Rules are ordered by severity — first match wins (cut after each clause).
% ─────────────────────────────────────────────────────────────────────────────

% CSAM — always critical; safe context does NOT bypass this.
classify(Text, _, critical, csam, immediate_ban_and_ip_ban,
         "CSAM content detected. Immediate permanent action required.") :-
    csam_phrase(P), contains_lower(Text, P), !.

% Hard drug trafficking — blocked unless educational/safe context.
classify(Text, _, critical, drug_trafficking, immediate_ban_and_ip_ban,
         "Drug trafficking coordination detected.") :-
    \+ has_safe_context(Text),
    drug_phrase(P), contains_lower(Text, P), !.

% Doxxing / PII exposure — escalates with prior offenses.
classify(Text, Prior, Severity, doxxing, Action, Desc) :-
    \+ has_safe_context(Text),
    doxx_phrase(P), contains_lower(Text, P), !,
    (   Prior >= 2
    ->  Severity = critical,
        Action   = immediate_ban_and_ip_ban,
        Desc     = "Repeated doxxing violations — permanent ban."
    ;   Severity = high,
        Action   = escalate,
        Desc     = "PII / doxxing exposure — escalated for review."
    ).

% Credible threats of violence — escalates with prior offenses.
classify(Text, Prior, Severity, credible_threat, Action, Desc) :-
    \+ has_safe_context(Text),
    threat_phrase(P), contains_lower(Text, P), !,
    (   Prior >= 1
    ->  Severity = high,
        Action   = escalate,
        Desc     = "Repeated credible threats detected."
    ;   Severity = medium,
        Action   = account_risk_flag,
        Desc     = "Credible threat — flagged for human review."
    ).

% Self-harm coordination — medium severity.
classify(Text, _, medium, self_harm, account_risk_flag,
         "Self-harm guidance coordination detected — flagged for welfare check.") :-
    \+ has_safe_context(Text),
    selfharm_phrase(P), contains_lower(Text, P), !.

% Server raid / spam coordination — low to medium.
classify(Text, Prior, Severity, raid_coordination, Action, Desc) :-
    \+ has_safe_context(Text),
    spam_phrase(P), contains_lower(Text, P), !,
    (   Prior >= 1
    ->  Severity = medium, Action = account_risk_flag,
        Desc = "Repeated raid/spam coordination."
    ;   Severity = low, Action = warning,
        Desc = "Raid or spam coordination detected."
    ).

% Default — safe.
classify(_, _, safe, none, none, "Content passed all moderation rules.").

% ─────────────────────────────────────────────────────────────────────────────
% Result output
% ─────────────────────────────────────────────────────────────────────────────

%% approved_flag(+Severity, -BoolAtom)
approved_flag(safe, @(true)).
approved_flag(low,  @(true)).   % low severity is a warning but message is allowed
approved_flag(_,    @(false)).

%% write_result(+Severity, +Reason, +Action, +Desc, +Prior)
write_result(Severity, Reason, Action, Desc, Prior) :-
    approved_flag(Severity, Approved),
    atom_string(Severity, SevS),
    atom_string(Reason,   ResS),
    atom_string(Action,   ActS),
    (atom(Desc) -> atom_string(Desc, DescS) ; DescS = Desc),
    Dict = json{
        severity:      SevS,
        reason:        ResS,
        action:        ActS,
        description:   DescS,
        approved:      Approved,
        priorOffenses: Prior
    },
    json_write_dict(current_output, Dict, []),
    nl,
    flush_output.

%% write_error_result/0  — emitted when request parsing fails.
write_error_result :-
    writeln('{"severity":"safe","reason":"parse_error","action":"none","approved":true,"priorOffenses":0,"description":"Request parse error — defaulting to safe."}'),
    flush_output.

% ─────────────────────────────────────────────────────────────────────────────
% Integer coercion helper
% ─────────────────────────────────────────────────────────────────────────────

coerce_int(N, N) :- integer(N), !.
coerce_int(F, N) :- float(F),   !, N is round(F).
coerce_int(A, N) :- atom(A),    atom_number(A, F), !, N is round(F).
coerce_int(_, 0).

% ─────────────────────────────────────────────────────────────────────────────
% Main event loop
%
% Reads newline-delimited JSON from stdin, processes each line, loops.
% Terminates cleanly on EOF.
% ─────────────────────────────────────────────────────────────────────────────

run_moderation_loop :-
    repeat,
        read_line_to_string(user_input, Line),
        (   Line == end_of_file
        ->  !
        ;   process_line(Line),
            fail
        ).

process_line(Line) :-
    (   catch(atom_json_dict(Line, Request, []), _, fail)
    ->  ( get_dict(content,       Request, Content) -> true ; Content = "" ),
        ( get_dict(priorOffenses, Request, P0)      -> true ; P0 = 0 ),
        coerce_int(P0, Prior),
        classify(Content, Prior, Severity, Reason, Action, Desc),
        write_result(Severity, Reason, Action, Desc, Prior)
    ;   write_error_result
    ).
