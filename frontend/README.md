# InterviewAI frontend

The frontend for InterviewAI is a React 19 application built with Vite and
TypeScript. It provides the public landing and authentication pages,
recruiter/admin workspace, candidate workspace, interview session, and
results views.

## Requirements

- Node.js 20.19+ (or Node.js 22.12+)
- npm

Check your versions before starting:

```bash
node --version
npm --version
```

## Getting started

From this directory (`frontend/`):

```bash
npm install
npm run dev
```

Open [http://localhost:4000](http://localhost:4000). The Vite server is
configured to listen on all interfaces, so it can also be opened from another
device using the development machine's local IP address.

The default port is `4000`. To use another port on Windows PowerShell:

```powershell
$env:PORT=4001
npm run dev
```

If port `4000` is already in use, stop the existing Vite process or set a
different `PORT`.

## Environment variables

API requests use `VITE_API_BASE_URL`. Create a `.env.local` file in this
directory when running against the backend:

```dotenv
VITE_API_BASE_URL=http://localhost:5000
```

Restart Vite after changing environment variables. The `VITE_` prefix is
required for variables to be available in browser code. If the API URL is not
configured, API helpers fail explicitly with a configuration error.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |
| `npm run format` | Format the project with Oxfmt |

Before opening a pull request, run:

```bash
npm run lint
npm run build
```

## Main routes

| Path | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/login` | Sign-in page |
| `/register` | Account registration |
| `/registration-status` | Registration status |
| `/dashboard` | Recruiter/admin dashboard |
| `/interviews/create` | Create an interview |
| `/reports/:id?` | Interview results |
| `/candidate` | Candidate dashboard |
| `/candidate/results` | Candidate results |
| `/candidate/interview` | Candidate interview session |

Routes are defined in `src/pages/Auth.tsx` and rendered through
`RouterProvider` in `src/app/routes.tsx`. Page components are lazy-loaded, so a
new route should export a component that can be resolved by its lazy import.

## Project structure

```text
src/
├── app/
│   ├── App.tsx       # Auth provider and router shell
│   ├── auth.tsx      # Local authentication state and registration state
│   └── routes.tsx    # RouterProvider entry point
├── components/
│   ├── layouts.tsx   # Public, dashboard, candidate, and auth layouts
│   └── ui.tsx        # Shared UI primitives
├── lib/
│   ├── api.ts        # API request helper
│   └── storage.ts    # Browser storage helpers
├── pages/            # Route-level page components
├── App.tsx           # Re-export of the app shell
└── main.tsx          # React entry point
```

## Authentication during development

The current authentication flow is client-side and stores user and
registration data in `localStorage`. It is intended for frontend development
and demonstration while backend authentication is integrated.

To reset the local development session, open the browser console and run:

```js
localStorage.removeItem("interviewai.user")
localStorage.removeItem("interviewai.registrations")
location.reload()
```

## Troubleshooting

### `useNavigate() may be used only in the context of a <Router>`

Render routed pages through the `RouterProvider` in `src/app/routes.tsx`.
Do not render a page containing React Router hooks directly from `main.tsx` or
`App.tsx`.

### `Lazy element type must resolve to a class or function`

Check that the module used by a `lazy()` route exports the component name
expected by the lazy import. A lazy import that resolves to `undefined` usually
means the export name or import path is incorrect.

### `npm build` does not work

Use the package script:

```bash
npm run build
```

### Port `4000` is already in use

Use another port:

```powershell
$env:PORT=4001
npm run dev
```

### The page shows stale code after a route or dependency change

Stop the dev server, remove the generated Vite cache, reinstall only if
necessary, and start again:

```powershell
Remove-Item -Recurse -Force node_modules\.vite
npm run dev
```
