# InterviewAI project handoff

**Review date:** 2026-10-07  
**Scope:** frontend, AI service, code-execution flow, and local closeout readiness

## Executive conclusion

The frontend and AI service are now integrated for the main interview flow. All
seven AI capabilities are exposed by the backend and connected to their
corresponding frontend flows through the shared API helper.

The integration has been verified through backend automated tests and a
successful frontend production build. The complete interview flow can be
demonstrated locally once the required environment variables, Groq API access,
and Docker runtime are configured.

The project is not yet considered production-ready. Before final handoff,
complete the remaining security and validation checks, especially provider-key
rotation and confirmation that secrets are never committed or shared.

## End-to-end architecture

```text
Browser (React/Vite at http://localhost:4000)
  -> frontend/src/lib/api.ts
  -> POST http://localhost:5000/api/...
  -> Express app
  -> route
  -> controller
  -> AI service
  -> prompt builder
  -> Groq model
  -> JSON parser
  -> AJV output-schema validation
  -> { success: true, data: ... }
  -> frontend unwraps data and renders/saves it
```

The backend mounts the AI routes and submission route in
[`ai-service/src/app.js`](./ai-service/src/app.js). The shared AI orchestration
is implemented in
[`ai-service/src/services/aiService.js`](./ai-service/src/services/aiService.js).
Each feature has a dedicated prompt and output schema under
[`ai-service/src/prompts/ai`](./ai-service/src/prompts/ai) and
[`ai-service/src/schemas/ai`](./ai-service/src/schemas/ai).

The API helper in
[`frontend/src/lib/api.ts`](./frontend/src/lib/api.ts) does the following:

1. Requires `VITE_API_BASE_URL`.
2. Sends JSON `POST` requests.
3. Parses the response envelope.
4. Returns `payload.data` to callers.
5. Throws explicit errors for HTTP failures, `success: false`, invalid JSON,
   or missing API configuration.

## The seven AI capabilities

| ID | Capability | Endpoint | Active frontend use | Status |
| --- | --- | --- | --- | --- |
| AI-001 | Technical interview questions | `POST /api/ai/questions` | [`CreateInterview.tsx`](./frontend/src/pages/CreateInterview.tsx) | Integrated |
| AI-002 | Resume-based questions | `POST /api/ai/resume-questions` | [`CreateInterview.tsx`](./frontend/src/pages/CreateInterview.tsx) | Integrated |
| AI-003 | Job-description questions | `POST /api/ai/job-description-questions` | [`CreateInterview.tsx`](./frontend/src/pages/CreateInterview.tsx) | Integrated |
| AI-004 | Adaptive follow-up question | `POST /api/ai/follow-up-questions` | [`InterviewSession.tsx`](./frontend/src/pages/InterviewSession.tsx) | Integrated |
| AI-005 | Code execution and code evaluation | `POST /api/submissions/execute` | [`InterviewSession.tsx`](./frontend/src/pages/InterviewSession.tsx) | Integrated through sandbox |
| AI-006 | Answer feedback | `POST /api/ai/feedback` | [`InterviewSession.tsx`](./frontend/src/pages/InterviewSession.tsx) | Integrated |
| AI-007 | Final interview report | `POST /api/ai/final-report` | [`Results.tsx`](./frontend/src/pages/Results.tsx) | Integrated |

All direct AI routes are declared in
[`ai-service/src/routes/aiRoutes.js`](./ai-service/src/routes/aiRoutes.js) and
return:

```json
{
  "success": true,
  "data": {}
}
```

Failures currently return HTTP 500 with:

```json
{
  "success": false,
  "error": "description"
}
```

### AI-001 to AI-003: question generation

The create-interview page selects one of three input modes:

- Role and technology stack -> `/api/ai/questions`
- Candidate resume -> `/api/ai/resume-questions`
- Job description -> `/api/ai/job-description-questions`

The returned questions are appended to local interview state and saved to
browser `localStorage` when the recruiter saves the interview. Duplicate
provider IDs are normalized before rendering so repeated `q1`, `q2`, or `q3`
responses do not collide in React or session state.

### AI-004 and AI-006: answer evaluation

For a theoretical/design question, the candidate submits an answer from
[`InterviewSession.tsx`](./frontend/src/pages/InterviewSession.tsx). The
frontend evaluates the answer privately and does not reveal scores or detailed
feedback during the interview. This prevents later answers from being coached
by earlier results.

The frontend sends two requests as needed:

1. `/api/ai/feedback` for structured score and feedback.
2. `/api/ai/follow-up-questions` to decide whether one follow-up is needed.

If a follow-up is needed, it becomes the active question and the candidate can
submit a new answer. The follow-up answer is evaluated separately. Feedback and
code-evaluation details are stored in session state but revealed only on the
final results page after the interview is complete. Progress and answers are
persisted in browser `localStorage`.

The candidate results page is intentionally separate from the recruiter report:

- Candidates see their overall score, strengths, growth opportunities,
  technical evaluation, communication evaluation, and next-step guidance.
- Recruiters also see the hiring recommendation and recommendation
  justification.

The explicit recommendation panel is hidden in the candidate view. AI-generated
candidate-facing summary text should also avoid leaking recommendation language
such as “Hire”, “No Hire”, or “Strong Hire”. If the provider includes that
language in a summary, update the final-report prompt or split the response
into candidate-safe feedback and recruiter-only recommendation fields.

### AI-005: code evaluation

Code evaluation is not a direct `/api/ai/*` request. The actual flow is:

```text
POST /api/submissions/execute
  -> submissionController.submitCode
  -> sandboxQueue
  -> judgeService.evaluateSubmission
  -> Docker container per test case
  -> execution result summary
  -> aiService.generateCodeEvaluation
  -> validated AI-005 response
```

The sandbox currently supports JavaScript and Python through
[`languageConfig.js`](./ai-service/src/judge/languageConfig.js), with resource
limits and a 10-second execution timeout in
[`dockerRunner.js`](./ai-service/src/judge/dockerRunner.js).

If Docker infrastructure fails, the controller returns a deterministic
infrastructure-failure result and does not ask the model to score the code.
This prevents a broken local Docker environment from being presented as a
candidate failure.

### AI-007: final report

When the interview is marked complete, [`Results.tsx`](./frontend/src/pages/Results.tsx)
builds a transcript, collects verbal feedback and code evaluations, and calls
`/api/ai/final-report`. The response is rendered as the candidate report.

## Shared AI-service behavior

The provider adapter in
[`ai-service/src/config/groq.js`](./ai-service/src/config/groq.js):

- Requires `GROQ_API_KEY`.
- Uses Groq model `openai/gpt-oss-120b`.
- Uses temperature `0.3`.
- Parses model output as JSON.

The shared runner in
[`ai-service/src/services/aiService.js`](./ai-service/src/services/aiService.js):

- Queues AI calls.
- Enforces an 8-second minimum gap between AI-call starts to reduce the risk of
  exceeding configured provider token and rate limits.
- Retries provider parse failures and schema-validation failures.
- Validates every successful response against its feature schema.
- Defaults to three total attempts (`maxRetries: 2`).

## Verification performed

### Passed

From `ai-service/`:

```powershell
npm test -- --runInBand
```

Result: **3 test suites passed, 25 tests passed, with 1 live smoke test
skipped** (4 suites total).

From `frontend/`:

```powershell
npm run lint
```

Result: **Frontend lint passed with `oxlint`.**

```powershell
npm run build
```

Result: **Vite production build passed**.

The automated tests primarily verify request validation, AI output schemas,
application behavior, and related integration logic. They do not fully prove
that a live Groq request or Docker execution is available.

### Historical verification note

The first review found that `oxlint` was unavailable. It has since been added
to the frontend development dependencies, and the current lint check passes.

## Completed fixes

The following closeout items have already been implemented:

- Route-level request validation returns HTTP 400 for malformed input.
- Coding fixtures consistently use `-1` when no unique character exists.
- The stale AI service documentation has been updated.
- The unused legacy `InterviewSetup.jsx` page has been removed.
- `oxlint` has been added and the frontend lint check passes.
- Final-report recommendation consistency is now enforced after schema
  validation.

## Remaining closeout checklist

### P0: rotate and protect the provider secret

The local backend environment was used with a Groq API key. Rotate the local
key before handoff as a precaution:

1. Revoke/rotate the key in the Groq dashboard.
2. Confirm `.env` files are listed in `.gitignore` and have never been
   committed.
3. Provide a redacted `.env.example` containing only variable names.
4. Set the replacement key only in the local/deployment environment.

Never put the key in this document, source code, screenshots, or a commit.

[`frontend/src/pages/AITestHarness.tsx`](./frontend/src/pages/AITestHarness.tsx)
is a development-only manual AI test harness for AI-004 through AI-007. It is
not part of the production user flow and is intentionally not registered in
the router.

### P2: confirm local runtime dependencies

To run the complete flow locally:

- Node.js must be installed.
- The backend must run on port 5000.
- The frontend `VITE_API_BASE_URL` must point to `http://localhost:5000`.
- `GROQ_API_KEY` must be set in the backend environment.
- Docker Desktop must be running for AI-005.
- Docker must be able to pull/use `node:20-alpine` and `python:3.12-alpine`.

### P2: keep candidate feedback separate from hiring decisions

The current candidate results layout correctly hides the explicit recruiter
recommendation panel. During review, the generated summary was observed to
mention the internal hiring recommendation in narrative text. Before final
release, update the final-report prompt and/or response model so candidate
feedback cannot disclose:

- Hiring recommendations.
- Recommendation justification.
- Internal hiring decision language.

The preferred final design is a shared evaluation with two presentation
surfaces: constructive candidate feedback for the candidate, and the
recommendation plus decision rationale for recruiters.

## Local closeout runbook

Open two PowerShell terminals.

### Terminal 1: backend

```powershell
Set-Location .\ai-service
npm install
$env:PORT=5000
# Set GROQ_API_KEY in the environment without committing it.
npm start
```

Useful URLs:

- Backend health: `http://localhost:5000/`
- Swagger UI: `http://localhost:5000/api-docs`

### Terminal 2: frontend

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Open `http://localhost:4000`.

### Manual acceptance path

1. Open the recruiter dashboard.
2. Create an interview with technical questions.
3. Confirm questions are generated and saved.
4. Open the candidate interview.
5. Submit a theoretical answer and confirm feedback plus follow-up behavior.
6. Submit a coding answer with Docker running and confirm code evaluation.
7. Complete the interview and confirm the final report is generated.
8. Reload the browser and confirm local progress is retained.
9. Stop the backend and confirm the frontend displays an explicit API error.

Live provider smoke tests consume rate limits and require credentials. Run them
only after the local health check and only when a real integration check is
needed:

```powershell
Set-Location .\ai-service
npx jest tests/smoke.test.js --runInBand
```

## Final status

## Backend persistence update

The backend now supports MongoDB-backed users and interviews with JWT
authentication. Authentication endpoints are available at `/api/auth/register`,
`/api/auth/login`, and `/api/auth/me`. AI, code-submission, and interview
endpoints require a valid bearer token.

Create the first administrator with `npm run create-admin` after setting
`ADMIN_EMAIL` and a temporary `ADMIN_PASSWORD` of at least 12 characters in the
backend environment. The password is hashed before storage and is never
written to source code.

Interview questions, candidate assignment by email, session progress, and final
reports are persisted through `/api/interviews`. Configure `MONGODB_URI`,
`JWT_SECRET`, `JWT_EXPIRES_IN`, and `FRONTEND_ORIGIN` in the backend environment
before starting the server. Existing browser `localStorage` data is not
automatically migrated; the new frontend creates and loads data through the
backend after authentication.

The backend listens on port `5000` and the Vite frontend listens on port `4000`
by default. The backend can be built and run with
[`ai-service/Dockerfile`](./ai-service/Dockerfile); see
[`ai-service/README.md`](./ai-service/README.md) for the production container
command. `FRONTEND_ORIGIN` must contain the exact deployed frontend origin in
production; multiple origins may be supplied as a comma-separated allowlist.

Candidate and recruiter reports are stored separately. Candidate API responses
never include recruiter recommendations or recommendation justification, while
recruiter/admin responses receive the recruiter report.

Candidate registration now sends a real SMTP verification email. Candidate
login is rejected until the one-time link is opened. Candidates also have a
separate `/candidate/practice` lab for generating questions, answering quiz
questions, receiving feedback, and running code without an assigned interview.

Administrators can deactivate or delete recruiter and candidate accounts from
the user management screen. Passwords are never displayed or retrievable;
only bcrypt password hashes are stored. Deleting a recruiter removes their
interviews, while deleting a candidate clears their interview assignments.

**Integration status:** Main frontend, backend, and AI-service flows are
connected; all seven AI capabilities are wired to their corresponding
frontend flows.

**Automated verification:** Backend tests pass with **25 passing tests across
3 passed suites and 1 skipped live smoke-test suite** (4 suites total).
Frontend lint passes with `oxlint`, and the frontend production build
completes successfully.

**Live verification:** Requires local environment configuration, valid Groq
credentials, and Docker for code execution. Automated tests do not fully
verify live Groq or Docker execution.

**Handoff status:** **Conditional.** Complete provider-key rotation/protection
and the manual live acceptance path. Also confirm that candidate-facing
summaries do not expose recruiter-only recommendation language before
considering the project fully finalized.
