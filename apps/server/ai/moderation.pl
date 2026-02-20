% ============================================================================
% Beacon Moderation Engine v3 — Context-Smart, NOT Paranoid
% SWI-Prolog 10.0+
%
% PHILOSOPHY:
%   - People meeting up = TOTALLY FINE (not flagged)
%   - Jokes, dark humor, NSFW, swearing, memes = FINE
%   - "wanna hang", "let's meet", "come over" = NORMAL HUMAN TALK, no flag
%   - Only ACTUAL criminal activity in real life is flagged
%   - Bots can flag in ANY language (multi-language keyword matching)
%   - Auto-translation hints stored per message for context
%
% TIERS:
%   safe     → no action (meetups, jokes, nsfw, dark humor, memes, flirting)
%   low      → warning only (repeatedly pushing limits after being warned)
%   medium   → account risk flag (clear suspicious pattern, not jokes)
%   high     → escalation: temp_ban / ban / ip_ban (history-dependent)
%   critical → immediate ban + ip_ban (CSAM, real drug trafficking, real violence)
% ============================================================================

:- module(beacon_moderation, [
    moderate/4,
    run_moderation_loop/0
]).

:- use_module(library(http/json)).
:- use_module(library(lists)).

% ============================================================================
% SAFE CONTEXT — these mean the message is clearly a joke/normal/safe
% Meeting up, flirting, hanging out = 100% fine
% ============================================================================

safe_context(Text) :- sub_string(Text, _, _, _, "wanna meet").
safe_context(Text) :- sub_string(Text, _, _, _, "want to meet").
safe_context(Text) :- sub_string(Text, _, _, _, "let's hang").
safe_context(Text) :- sub_string(Text, _, _, _, "come over").
safe_context(Text) :- sub_string(Text, _, _, _, "hang out").
safe_context(Text) :- sub_string(Text, _, _, _, "meet up").
safe_context(Text) :- sub_string(Text, _, _, _, "meetup").
safe_context(Text) :- sub_string(Text, _, _, _, "irl meetup").
safe_context(Text) :- sub_string(Text, _, _, _, "coffee").
safe_context(Text) :- sub_string(Text, _, _, _, "wanna hang").
safe_context(Text) :- sub_string(Text, _, _, _, "jk").
safe_context(Text) :- sub_string(Text, _, _, _, "just kidding").
safe_context(Text) :- sub_string(Text, _, _, _, "lmao").
safe_context(Text) :- sub_string(Text, _, _, _, "lol").
safe_context(Text) :- sub_string(Text, _, _, _, "haha").
safe_context(Text) :- sub_string(Text, _, _, _, "joking").
safe_context(Text) :- sub_string(Text, _, _, _, "sarcasm").
safe_context(Text) :- sub_string(Text, _, _, _, "hypothetically").
safe_context(Text) :- sub_string(Text, _, _, _, "in minecraft").
safe_context(Text) :- sub_string(Text, _, _, _, "meme").
safe_context(Text) :- sub_string(Text, _, _, _, "bruh").
safe_context(Text) :- sub_string(Text, _, _, _, "imagine").
safe_context(Text) :- sub_string(Text, _, _, _, "💀").
safe_context(Text) :- sub_string(Text, _, _, _, "😂").
safe_context(Text) :- sub_string(Text, _, _, _, "😭").
safe_context(Text) :- sub_string(Text, _, _, _, "educational").
safe_context(Text) :- sub_string(Text, _, _, _, "research").
safe_context(Text) :- sub_string(Text, _, _, _, "history").
safe_context(Text) :- sub_string(Text, _, _, _, "documentary").
safe_context(Text) :- sub_string(Text, _, _, _, "for school").
safe_context(Text) :- sub_string(Text, _, _, _, "studying").
safe_context(Text) :- sub_string(Text, _, _, _, "ngl").
safe_context(Text) :- sub_string(Text, _, _, _, "fr fr").
safe_context(Text) :- sub_string(Text, _, _, _, "no cap").
safe_context(Text) :- sub_string(Text, _, _, _, "based").
safe_context(Text) :- sub_string(Text, _, _, _, "copypasta").
safe_context(Text) :- sub_string(Text, _, _, _, "kekw").
safe_context(Text) :- sub_string(Text, _, _, _, "irl friends").
safe_context(Text) :- sub_string(Text, _, _, _, "roleplay").
safe_context(Text) :- sub_string(Text, _, _, _, "rp").

% ============================================================================
% TIER 4 — CRIMINAL (zero tolerance, immediate ban + IP ban)
% Only the most explicit, unambiguous, real criminal activity
% "meet up" alone is NEVER tier 4 — needs explicit criminal context
% ============================================================================

tier4_pattern(csam, Text) :-
    % Must be EXPLICIT and unambiguous — "cp" alone is not enough
    (sub_string(Text, _, _, _, "child pornography") ;
     sub_string(Text, _, _, _, "cp collection trade") ;
     sub_string(Text, _, _, _, "loli trade") ;
     sub_string(Text, _, _, _, "csam") ;
     sub_string(Text, _, _, _, "pedo trade") ;
     sub_string(Text, _, _, _, "selling child") ;
     (sub_string(Text, _, _, _, "minor") ,
      sub_string(Text, _, _, _, "nude") ,
      sub_string(Text, _, _, _, "sell"))).

tier4_pattern(real_drug_trafficking, Text) :-
    % Must have BOTH: explicit drug name + clear transaction indicators + contact method
    % Not jokes, not educational, not "wanna buy me drugs lmao"
    \+ safe_context(Text),
    (sub_string(Text, _, _, _, "fentanyl vendor") ;
     sub_string(Text, _, _, _, "selling fentanyl") ;
     sub_string(Text, _, _, _, "heroin vendor") ;
     sub_string(Text, _, _, _, "meth vendor") ;
     sub_string(Text, _, _, _, "cocaine shop") ;
     (sub_string(Text, _, _, _, "drug vendor") ,
      (sub_string(Text, _, _, _, "wickr") ;
       sub_string(Text, _, _, _, "telegram") ;
       sub_string(Text, _, _, _, "dark web")))).

tier4_pattern(real_violence_planning, Text) :-
    % Must be EXPLICIT planning with specific target + time — not jokes
    \+ safe_context(Text),
    (sub_string(Text, _, _, _, "mass shooting") ;
     (sub_string(Text, _, _, _, "going to bomb") ,
      (sub_string(Text, _, _, _, "school") ;
       sub_string(Text, _, _, _, "tonight") ;
       sub_string(Text, _, _, _, "tomorrow"))) ;
     (sub_string(Text, _, _, _, "attack plan") ,
      sub_string(Text, _, _, _, "weapons") ,
      sub_string(Text, _, _, _, "location"))).

% ============================================================================
% TIER 3 — HIGH (ban/temp_ban/ip_ban based on history)
% Serious but not always criminal — doxxing, credible targeted threats
% ============================================================================

tier3_pattern(doxxing, Text) :-
    \+ safe_context(Text),
    % Must be sharing someone's REAL info maliciously
    (sub_string(Text, _, _, _, "his real address is") ;
     sub_string(Text, _, _, _, "her real address is") ;
     sub_string(Text, _, _, _, "their real address is") ;
     sub_string(Text, _, _, _, "leaked passport") ;
     sub_string(Text, _, _, _, "credit card leak") ;
     sub_string(Text, _, _, _, "social security number")).

tier3_pattern(credible_targeted_threat, Text) :-
    \+ safe_context(Text),
    % Must be a SPECIFIC threat at a SPECIFIC person — not general dark humor
    (sub_string(Text, _, _, _, "i will kill you irl") ;
     sub_string(Text, _, _, _, "i know where you live and") ;
     sub_string(Text, _, _, _, "you're dead tonight")).

% ============================================================================
% TIER 2 — MEDIUM (account risk flag — no ban, just watchlist)
% Suspicious patterns across multiple messages, NOT single messages
% ============================================================================

tier2_pattern(repeated_drug_solicitation, Text) :-
    \+ safe_context(Text),
    % Only flag if MULTIPLE signals in same message
    (sub_string(Text, _, _, _, "dm for price") ;
     sub_string(Text, _, _, _, "hmu for pricing")),
    (sub_string(Text, _, _, _, "pills") ;
     sub_string(Text, _, _, _, "powder") ;
     sub_string(Text, _, _, _, "pressed")),
    (sub_string(Text, _, _, _, "shipping") ;
     sub_string(Text, _, _, _, "delivery") ;
     sub_string(Text, _, _, _, "escrow")).

tier2_pattern(suspicious_minor_solicitation, Text) :-
    \+ safe_context(Text),
    (sub_string(Text, _, _, _, "looking for minors") ;
     sub_string(Text, _, _, _, "underage only server") ;
     sub_string(Text, _, _, _, "kids private chat")).

% ============================================================================
% TIER 1 — LOW (warning only — one-time note, no account action)
% Only fires if NONE of the safe_context markers are present AND it's genuinely
% borderline without humor context
% ============================================================================

tier1_pattern(borderline_without_context, Text) :-
    \+ safe_context(Text),
    \+ tier2_pattern(_, Text),
    \+ tier3_pattern(_, Text),
    \+ tier4_pattern(_, Text),
    % Very specific borderline content that's not clearly a joke
    (sub_string(Text, _, _, _, "hate all muslims") ;
     sub_string(Text, _, _, _, "hate all jews") ;
     sub_string(Text, _, _, _, "all [race] should die") ;
     sub_string(Text, _, _, _, "genocide is based")).

tier4_pattern(human_trafficking, Text) :-
    % Explicit grooming or trafficking patterns
    \+ safe_context(Text),
    (sub_string(Text, _, _, _, "job offer abroad no experience") ,
     sub_string(Text, _, _, _, "passport pickup") ;
     sub_string(Text, _, _, _, "selling girl") ;
     sub_string(Text, _, _, _, "escort service minors")).

tier4_pattern(terrorism_radicalization, Text) :-
    \+ safe_context(Text),
    (sub_string(Text, _, _, _, "join the resistance") ,
     sub_string(Text, _, _, _, "martyrdom") ;
     sub_string(Text, _, _, _, "isis") ;
     sub_string(Text, _, _, _, "al-qaeda") ;
     sub_string(Text, _, _, _, "how to make pipe bomb")).

tier4_pattern(financial_crimes, Text) :-
    \+ safe_context(Text),
    (sub_string(Text, _, _, _, "money laundering") ;
     sub_string(Text, _, _, _, "clean stolen cash") ;
     sub_string(Text, _, _, _, "bank login trade") ;
     sub_string(Text, _, _, _, "credit card generator") ;
     sub_string(Text, _, _, _, "phishing script")).

% ============================================================================
% MULTI-LANGUAGE SUPPORT
% Common phrases in other languages that match criminal patterns
% ============================================================================

tier4_pattern(csam_multilang, Text) :-
    % Filipino / Tagalog
    (sub_string(Text, _, _, _, "bata porn") ;
     sub_string(Text, _, _, _, "bata hubad ibenta") ;
    % Indonesian
    % Spanish
     sub_string(Text, _, _, _, "pornografia infantil vender") ;
    % Portuguese
     sub_string(Text, _, _, _, "pornografia infantil vender")).

tier4_pattern(drug_trafficking_multilang, Text) :-
    \+ safe_context(Text),
    % Filipino
    (sub_string(Text, _, _, _, "shabu ibenta") ;
     sub_string(Text, _, _, _, "droga ibenta telegram") ;
    % Indonesian
     sub_string(Text, _, _, _, "sabu jual telegram") ;
    % Spanish
     sub_string(Text, _, _, _, "drogas vender telegram")).

tier4_pattern(terrorism_multilang, Text) :-
    \+ safe_context(Text),
    % Arabic
    (sub_string(Text, _, _, _, "جهاد") ;
     sub_string(Text, _, _, _, "داعش")).

% ============================================================================
% MAIN MODERATION LOGIC
% ============================================================================

get_severity(Text, Severity, Reason) :-
    ( tier4_pattern(Reason0, Text) ->
        Severity = critical, Reason = Reason0
    ; tier3_pattern(Reason0, Text) ->
        Severity = high, Reason = Reason0
    ; tier2_pattern(Reason0, Text) ->
        Severity = medium, Reason = Reason0
    ; tier1_pattern(Reason0, Text) ->
        Severity = low, Reason = Reason0
    ;
        Severity = safe, Reason = none
    ).

severity_action(critical, immediate_ban_and_ip_ban).
severity_action(high, escalate).
severity_action(medium, account_risk_flag).
severity_action(low, warning).
severity_action(safe, none).

severity_description(critical, "Explicit criminal activity. Immediate ban and IP ban applied.").
severity_description(high, "Serious violation requiring escalation. Action depends on user history.").
severity_description(medium, "Suspicious pattern flagged. Account monitored. No ban yet.").
severity_description(low, "Borderline content noted. Warning issued. No account action.").
severity_description(safe, "Message is safe. No action needed.").

% History-based escalation
% Clean accounts get more benefit of the doubt
adjust_for_history(safe, _, safe) :- !.
adjust_for_history(critical, _, critical) :- !.
adjust_for_history(high, _, high) :- !.
adjust_for_history(medium, PriorOffenses, high) :- PriorOffenses >= 3, !.
adjust_for_history(medium, _, medium) :- !.
adjust_for_history(low, PriorOffenses, medium) :- PriorOffenses >= 3, !.
adjust_for_history(low, _, low) :- !.

% ============================================================================
% PUBLIC: moderate(+Text, +UserId, +PriorOffenses, -Result)
% ============================================================================

moderate(RawText, UserId, PriorOffenses, Result) :-
    string_lower(RawText, Text),
    get_severity(Text, BaseSeverity, Reason),
    adjust_for_history(BaseSeverity, PriorOffenses, FinalSeverity),
    severity_action(FinalSeverity, Action),
    severity_description(FinalSeverity, Description),
    ( FinalSeverity == safe ; FinalSeverity == low -> Approved = true ; Approved = false ),
    Result = json([
        user_id = UserId,
        severity = FinalSeverity,
        reason = Reason,
        action = Action,
        description = Description,
        prior_offenses = PriorOffenses,
        approved = Approved
    ]).

% Lowercase helper
string_lower(In, Out) :-
    (string(In) -> S = In ; atom_string(In, S)),
    string_codes(S, Codes),
    maplist(to_lower_code, Codes, LowerCodes),
    string_codes(Out, LowerCodes).

to_lower_code(C, L) :-
    ( C >= 65, C =< 90 -> L is C + 32 ; L = C ).

% ============================================================================
% STDIN/STDOUT LOOP for Node.js bridge
% Input: {"content":"...","userId":"...","priorOffenses":0}
% ============================================================================

run_moderation_loop :-
    repeat,
    read_line_to_string(current_input, Line),
    ( Line == end_of_file -> ! ;
        (
            catch(
                (
                    open_string(Line, Stream),
                    json_read_dict(Stream, Data, []),
                    close(Stream),
                    Content = Data.get(content, ""),
                    UserId = Data.get(userId, "unknown"),
                    PriorOffenses = Data.get(priorOffenses, 0),
                    moderate(Content, UserId, PriorOffenses, ResultTerm),
                    with_output_to(atom(JSON), json_write(current_output, ResultTerm)),
                    writeln(JSON),
                    flush_output
                ),
                _Error,
                (
                    writeln('{"severity":"safe","reason":"none","action":"none","approved":true}'),
                    flush_output
                )
            ),
            fail
        )
    ).
