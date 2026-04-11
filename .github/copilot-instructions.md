# Project Guidelines

## Code Style
- Use JavaScript and JSX only. Do not introduce TypeScript files.
- Use functional React components with arrow functions.
- Use absolute imports via `@/` for app code.
- Keep page components focused on layout and orchestration. Move business logic to hooks, api services, or lib utilities.
- Reuse existing utilities and schemas before adding new helpers.

## Architecture
- Routes are centralized in `src/routes/router.jsx` and path constants in `src/routes/paths.js`.
- Protect route access with existing guards in `src/guards/` (`auth-guard`, `guest-guard`, and role-based guard).
- Put backend calls in `src/apis/*.api.js`; use the shared axios client in `src/lib/http.js` instead of raw axios instances.
- Keep shared state in `src/contexts/` (AuthContext) and feature data logic in `src/hooks/`.
- Validation schemas live in `src/schema/` (Zod).

## Build And Test
- Install dependencies: `npm install`
- Run local dev server: `npm run dev`
- Lint: `npm run lint`
- Production build: `npm run build`
- Preview production build: `npm run preview`
- Backend expectation: Vite proxies `/api` to `http://localhost:8081` (see `vite.config.js`).
- Testing note: no automated unit test runner is currently configured in `package.json`.

## Conventions
- Follow existing domain structure under `src/pages/`, `src/apis/`, and `src/hooks/` when adding features.
- Use route constants from `src/routes/paths.js` instead of hardcoding paths.
- Keep API payload and response handling consistent with existing api files (including `FormData` flows for file uploads).
- Prefer minimal, focused edits and preserve existing naming/style patterns in each folder.

## Project-Specific References
- Frontend implementation rules: `.github/instructions/Fontend - Learnify - Instrucment.instructions.md`
- Unit test matrix format rules: `.github/instructions/Learnify - Unit Test.instructions.md`
- Starter app README (currently generic Vite template): `README.md`