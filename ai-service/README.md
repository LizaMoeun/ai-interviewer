# InterviewAI backend

The backend listens on port `5000` by default and requires MongoDB, a JWT
secret, and a Groq API key. Copy `.env.example` to `.env` and set
`MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, and `FRONTEND_ORIGIN` before
starting it. Candidate registration also requires SMTP configuration so the
backend can send the real verification email.

Run locally from this directory:

```powershell
npm install
npm start
```

Run the production container:

```powershell
docker build -t interviewai-backend .
docker run --rm -p 5000:5000 `
  --env-file .env `
  interviewai-backend
```

`FRONTEND_ORIGIN` is a comma-separated allowlist of exact browser origins, for
example `https://app.example.com`. Production startup fails when it is not
configured, and wildcard CORS is not supported.

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and optionally
`SMTP_FROM` to enable candidate email verification. Candidate accounts cannot
log in until the emailed link is opened.
