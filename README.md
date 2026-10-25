# ShowWork

FNB AOTY Hackathon 2026 prototype by The Sponges. Try fictional retail situations, save original and revised work, and share a revocable snapshot with a reviewer.

## Current scope
Three tasks; server-persisted attempts; versioned deterministic language checks; practice recommendations; private demo sessions; share/revoke; deletion. Demo sessions expire after seven days. No real applicant data should be entered.

No paid API is called. `lib/optional-ai.ts` contains a server-side OpenAI transport with timeout, explicit configuration, bounded output and exact-evidence validation. It is deliberately **not imported by any live route**. Tests use a mock provider. Live provider integration, costs, output quality, consent and abuse limits must be reviewed before connecting it to a user-facing route. No API key was created for this submission.

## Run
Node >=22.13 and npm. `npm ci`, `npm run db:generate` only after schema changes, apply local D1 migrations as described below, then `npm run dev`. The Sites starter supplies local Worker and D1 bindings. `npm run build` builds the app. `npm run test` tests pure logic and mock API behaviour.

## Architecture
React/Vinext -> same-origin Worker route -> D1. User data never enters the optional AI adapter in this demo. Authenticated demo sessions use random HttpOnly SameSite cookies; only a hash is stored. Share tokens grant read access to a snapshot of one task. All write routes check Origin, session ownership, input limits and applicable quotas. No candidate ranking, automatic hiring decisions or credentials.

## Privacy and limits
This is not a production recruitment system. Cookie loss loses demo access. A saved/printed copy cannot be revoked. Phrase rules can be fooled by negation, unrelated wording or copy-paste; they do not evaluate competence. Expired records are purged when a new session is created; expired sessions cannot access records meanwhile. Global and per-session quotas bound writes, but are not a complete anti-abuse system.

## Verification
See `VERIFICATION.md` for actual executed checks and limitations. Do not equate passing language tests with employer validation. No primary research or traction is claimed.
