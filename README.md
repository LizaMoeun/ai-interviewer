# InterviewAI

InterviewAI is a full-stack AI-assisted interviewing platform. Recruiters can
create interviews and review candidate submissions, while candidates can
register, complete interviews, submit code, and view feedback and reports.

The repository contains:

- `frontend/`: React 19 + TypeScript + Vite web application.
- `ai-service/`: Express API, MongoDB persistence, authentication, email
  verification, AI question generation/evaluation, and code judging.

## Requirements

- Node.js 22.x (the backend container uses Node 22)
- npm
- MongoDB deployment
- Groq API key
- SMTP account for candidate email verification
- Docker, if deploying the backend as a container

## Local development

### Backend

```powershell
cd ai-service
Copy-Item .env.example .env
# Edit .env and provide MONGODB_URI, JWT_SECRET, and GROQ_API_KEY.
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default.

### Frontend

Create `frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:5000
```

Then run:

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server listens on `http://localhost:4000`.

## Environment configuration

Never commit `.env`, `.env.local`, API keys, passwords, JWT secrets, or
database connection strings. The repository ignores these files; deployment
platform secret stores or environment settings should be used instead.

### Backend variables

Copy `ai-service/.env.example` to `ai-service/.env` for local development.

| Variable | Required | Production guidance |
| --- | --- | --- |
| `NODE_ENV` | Yes | Set to `production`. |
| `PORT` | No | Use the platform-provided port when required; default is `5000`. |
| `MONGODB_URI` | Yes | Use the production MongoDB URI and restrict database network access. |
| `JWT_SECRET` | Yes | Use a long, random secret of at least 32 characters. |
| `JWT_EXPIRES_IN` | No | Defaults to `1d`; choose a policy appropriate for your deployment. |
| `GROQ_API_KEY` | Yes | Store as a deployment secret and rotate if exposed. |
| `FRONTEND_ORIGIN` | Yes | Use the exact HTTPS frontend origin, without `*`; comma-separated origins are supported. |
| `ADMIN_NAME` | For admin bootstrap | Display name used by the admin creation script. |
| `ADMIN_EMAIL` | For admin bootstrap | Initial administrator email address. |
| `ADMIN_PASSWORD` | For admin bootstrap | Strong initial password; do not commit it. |
| `SMTP_HOST` | Yes for verification email | SMTP server hostname. |
| `SMTP_PORT` | Yes for verification email | Usually `587` for STARTTLS or `465` for implicit TLS. |
| `SMTP_SECURE` | Yes for verification email | `true` for implicit TLS, otherwise `false`. |
| `SMTP_USER` | Yes for verification email | SMTP username. |
| `SMTP_PASSWORD` | Yes for verification email | SMTP password or provider token. |
| `SMTP_FROM` | Recommended | Verified sender address. Defaults to `SMTP_USER` when omitted. |

For production, the backend should have values equivalent to:

```dotenv
NODE_ENV=production
PORT=5000
MONGODB_URI=<production MongoDB URI>
JWT_SECRET=<random secret, at least 32 characters>
JWT_EXPIRES_IN=1d
GROQ_API_KEY=<Groq API key>
FRONTEND_ORIGIN=https://<your-frontend-domain>
SMTP_HOST=<SMTP hostname>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<SMTP username>
SMTP_PASSWORD=<SMTP password or token>
SMTP_FROM=<verified sender email>
```

Do not paste real values into this README or into tracked files.

### Frontend variables

Set this in the frontend deployment environment before building:

```dotenv
VITE_API_BASE_URL=https://<your-backend-domain>
```

Because Vite embeds `VITE_` variables into browser JavaScript, this value is
not secret. Do not put backend secrets in frontend variables.

## Production deployment

### Backend container

Build and run the backend from `ai-service/`:

```powershell
cd ai-service
docker build -t interviewai-backend .
docker run --rm -p 5000:5000 --env-file .env interviewai-backend
```

For a hosted deployment, push the image to the provider's registry and set
the environment variables in the provider's secret configuration. Do not
deploy the local `.env` file.

The container:

- installs production dependencies with `npm ci --omit=dev`;
- listens on port `5000` by default;
- runs as the non-root `node` user;
- starts only after MongoDB connection succeeds.

### Frontend

```powershell
cd frontend
npm install
npm run build
```

Deploy the generated `frontend/dist/` directory to a static hosting provider.
Configure SPA fallback routing so paths such as `/login`,
`/candidate/interview`, and `/reports/:id` serve `index.html`.

After deployment, set the backend `FRONTEND_ORIGIN` to the exact deployed
frontend URL and set the frontend `VITE_API_BASE_URL` to the exact deployed
backend URL. Rebuild the frontend after changing `VITE_API_BASE_URL`.

For the current deployments, use these values:

```dotenv
# Render backend environment
FRONTEND_ORIGIN=https://ai-interviewer-flame-alpha.vercel.app

# Vercel frontend environment
VITE_API_BASE_URL=https://ai-interviewer-xwcc.onrender.com
```

Do not use the Vercel project dashboard URL
(`https://vercel.com/...`) as `FRONTEND_ORIGIN`; it is not the browser origin
of the deployed application. Also omit the trailing slash. After changing
either setting, redeploy the affected service. If Render logs
`Origin is not allowed by CORS`, compare the browser's application URL exactly
with `FRONTEND_ORIGIN`, including protocol and subdomain.

## Verification before pushing or deploying

Run the checks from the corresponding directories:

```powershell
cd ai-service
npm test -- --runInBand
npm ci --omit=dev

cd ..\frontend
npm run lint
npm run build
```

If deploying the container, also run:

```powershell
cd ..\ai-service
docker build -t interviewai-backend .
```

The regular Jest suite excludes the live Groq smoke test. Run that test only
when the API key and network access are intentionally available:

```powershell
$env:RUN_LIVE_SMOKE="1"
npx jest tests/smoke.test.js
```

## Git workflow

Review the changes and ensure no local environment files are staged:

```powershell
git status
git diff --check
git diff --stat
git diff -- ai-service/.env frontend/.env
```

Stage and commit the project changes:

```powershell
git add README.md PROJECT_HANDOFF.md ai-service frontend
git status
git commit -m "Prepare InterviewAI for deployment" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push origin main
```

Before pushing, confirm that `git status` does not list `.env`,
`.env.local`, credentials, private keys, or generated build output.

## API areas

- `/api/auth`: registration, login, email verification, and user management.
- `/api/interviews`: interview creation, questions, reports, and access.
- `/api/ai`: AI question generation, follow-ups, feedback, and reports.
- `/api/submissions`: authenticated code submissions and judging.
- `/api-docs`: Swagger API documentation.

## Important operational notes

- Candidate registration requires working SMTP configuration and email
  verification before login.
- Production CORS rejects origins not listed in `FRONTEND_ORIGIN`.
- MongoDB must be reachable from the backend deployment.
- Keep the initial admin credentials in a secret manager and rotate them after
  creating the administrator.
- The backend production dependency audit should be reviewed regularly. Avoid
  applying `npm audit fix --force` without reviewing possible breaking changes.
