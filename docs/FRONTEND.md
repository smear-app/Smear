Frontend plan — Smear (React)
=================================

Goals
-----
- Fast, mobile-first UI for logging climbs.
- Minimal friction for common flows: quick log, review history, view progress.

High-level structure
--------------------
- Pages / routes:
  - / — Landing + quick login/signup
  - /app — Authenticated app shell (redirects to /app/dashboard)
  - /app/dashboard — Summary, recent climbs, quick-add
  - /app/log — Full log-a-climb flow
  - /app/climbs/:id — Climb detail and edit
  - /app/routes/:id — Route details
  - /app/gyms — Gym selector / map
  - /app/profile — User settings

Components
----------
- Top-level AppShell (header, nav, auth guard)
- ClimbForm (modular: selects route/gym, grades, attempts, notes)
- RecentClimbsList (infinite scroll)
- ProgressCharts (grade-over-time, attempts histogram)
- LeaderboardCard

State & data fetching
---------------------
- Use React Query (TanStack Query) for server state (caching, background refresh, optimistic updates).
- Small local UI state in components or Zustand for cross-cutting concerns (current gym selection, grade format preferences).

UI/UX notes
-----------
- Optimize the 'Log a Climb' flow: prefer one-screen or modal for quick logging.
- Provide sensible defaults: current date/time, last-gym selected.
- Mobile-first design with large touch targets for attempt counts and grade selection.

Grade input
-----------
- Support multiple grade systems in UI; show both raw and converted grade (if user prefers).

Testing
-------
- Unit: React Testing Library + Jest
- E2E: Playwright or Cypress for full logging flows

Tooling
-------
- Vite + React (recommended) for faster builds, or Create React App if preferred.
- TypeScript strongly recommended to reduce runtime errors.

Accessibility
-------------
- Ensure form controls are keyboard-navigable and labeled.
- Color contrast for grade chips and badges.
Frontend plan — Smear (React)
=================================

Goals
-----
- Fast, mobile-first UI for logging climbs.
- Minimal friction for common flows: quick log, review history, view progress.

High-level structure
--------------------
- Pages / routes:
  - / — Landing + quick login/signup
  - /app — Authenticated app shell (redirects to /app/dashboard)
  - /app/dashboard — Summary, recent climbs, quick-add
  - /app/log — Full log-a-climb flow
  - /app/climbs/:id — Climb detail and edit
  - /app/routes/:id — Route details
  - /app/gyms — Gym selector / map
  - /app/profile — User settings

Components
----------
- Top-level AppShell (header, nav, auth guard)
- ClimbForm (modular: selects route/gym, grades, attempts, notes)
- RecentClimbsList (infinite scroll)
- ProgressCharts (grade-over-time, attempts histogram)
- LeaderboardCard

State & data fetching
---------------------
- Use React Query (TanStack Query) for server state (caching, background refresh, optimistic updates).
- Small local UI state in components or Zustand for cross-cutting concerns (current gym selection, grade format preferences).

UI/UX notes
-----------
- Optimize the 'Log a Climb' flow: prefer one-screen or modal for quick logging.
- Provide sensible defaults: current date/time, last-gym selected.
- Mobile-first design with large touch targets for attempt counts and grade selection.

Grade input
-----------
- Support multiple grade systems in UI; show both raw and converted grade (if user prefers).

Testing
-------
- Unit: React Testing Library + Jest
- E2E: Playwright or Cypress for full logging flows

Tooling
-------
- Vite + React (recommended) for faster builds, or Create React App if preferred.
- TypeScript strongly recommended to reduce runtime errors.

Accessibility
-------------
- Ensure form controls are keyboard-navigable and labeled.
- Color contrast for grade chips and badges.
