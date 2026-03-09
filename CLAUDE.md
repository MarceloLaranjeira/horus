# CLAUDE.md — Horus AI Assistant

This file provides guidance for AI assistants working on the **Horus** codebase.

---

## Project Overview

**Horus** ("Seu Jarvis Pessoal") is a Portuguese-language personal AI assistant and life-management PWA. It integrates tasks, habits, reminders, notes, finances, calendar, email, and WhatsApp into a single conversational interface powered by AI.

**Tech Stack:**
- **Frontend:** React 18.3 + TypeScript (via Vite 5.4 + SWC)
- **UI:** shadcn/ui (Radix UI primitives) + Tailwind CSS 3.4
- **Backend:** Supabase (Postgres, Auth, Edge Functions, Realtime)
- **State:** React Context + TanStack Query (React Query)
- **Testing:** Vitest 3.2 + @testing-library/react
- **Deployment platform:** Lovable.dev (git-synchronized)

---

## Repository Layout

```
/
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite + PWA config, dev port 8080
├── tailwind.config.ts          # Theme, dark mode (class-based)
├── tsconfig.json               # TypeScript root config
├── eslint.config.js            # ESLint 9 flat config
├── vitest.config.ts            # Test config (jsdom, globals on)
├── package.json                # Scripts and dependencies
│
├── public/                     # Static assets (icons, manifest, robots.txt)
│
├── supabase/
│   ├── config.toml             # Supabase local config
│   └── functions/              # Deno-based Edge Functions
│       ├── chat/               # AI chat handler
│       ├── gmail/              # Gmail API integration
│       ├── whatsapp/           # WhatsApp integration
│       ├── tts/                # Text-to-speech
│       ├── elevenlabs-tts/     # ElevenLabs TTS
│       └── test-google-calendar/
│
└── src/
    ├── main.tsx                # React entry point
    ├── App.tsx                 # Router + providers
    ├── index.css               # Global styles (Tailwind + CSS vars)
    │
    ├── pages/                  # Route-level pages
    │   ├── Index.tsx           # Root/landing redirect
    │   ├── AuthPage.tsx        # Login / sign-up
    │   ├── AppDashboard.tsx    # Main authenticated shell
    │   ├── ResetPasswordPage.tsx
    │   └── NotFound.tsx
    │
    ├── components/
    │   ├── ui/                 # shadcn/ui primitives (DO NOT edit manually)
    │   └── app/                # Feature components
    │       ├── ChatView.tsx          # AI chat interface (~54 KB)
    │       ├── DashboardView.tsx     # Home dashboard (~46 KB)
    │       ├── FinancesView.tsx      # Finance tracker (~43 KB)
    │       ├── AgendaView.tsx        # Calendar/agenda
    │       ├── SettingsAIView.tsx    # AI configuration
    │       ├── AppSidebar.tsx        # Navigation sidebar
    │       ├── HabitsView.tsx        # Habit tracking
    │       ├── TasksView.tsx         # Task management
    │       ├── ProjectsView.tsx      # Project management
    │       ├── NotesView.tsx         # Notes/documents
    │       ├── RemindersView.tsx     # Reminders
    │       ├── GmailView.tsx         # Gmail integration
    │       ├── WhatsAppView.tsx      # WhatsApp messaging
    │       ├── AnalysisView.tsx      # Analytics/charts
    │       ├── DailyBriefingModal.tsx
    │       ├── CommandPalette.tsx
    │       ├── HorusConstellation.tsx # Animated branding
    │       ├── ProtectedRoute.tsx
    │       ├── GoogleCalendarOAuthHandler.tsx
    │       └── Settings*View.tsx     # Settings sub-pages
    │
    ├── hooks/                  # Custom React hooks
    │   ├── useAuth.tsx         # Auth context & session
    │   ├── useAISettings.tsx   # AI provider / model config
    │   ├── useTasks.ts
    │   ├── useHabits.ts
    │   ├── useNotes.ts
    │   ├── useReminders.ts
    │   ├── useProjects.ts
    │   ├── useFinances.ts
    │   ├── useGoogleCalendar.ts
    │   ├── useGmail.ts
    │   ├── useWhatsApp.ts
    │   ├── useTheme.ts
    │   ├── usePWAInstall.ts
    │   ├── use-toast.ts
    │   └── use-mobile.tsx
    │
    ├── lib/
    │   ├── utils.ts            # cn() helper (clsx + tailwind-merge)
    │   ├── confetti.ts         # Celebration animation
    │   └── custom-toast.tsx
    │
    ├── integrations/
    │   ├── supabase/
    │   │   ├── client.ts       # Supabase client singleton
    │   │   └── types.ts        # Auto-generated DB types
    │   └── lovable/            # Lovable platform helpers
    │
    ├── assets/                 # Images and SVGs
    └── test/
        ├── setup.ts            # Vitest global setup
        └── example.test.ts
```

---

## Development Workflows

### Setup

```bash
npm install          # Install dependencies (or: bun install)
cp .env.example .env # Create env file and fill in Supabase credentials
npm run dev          # Start dev server at http://localhost:8080
```

### Common Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server (port **8080**) |
| `npm run build` | Production build → `dist/` |
| `npm run build:dev` | Development build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

### Environment Variables

The app requires these in `.env`:

```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-anon-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
```

---

## Architecture & Key Conventions

### Routing

React Router v6 with the following top-level routes (defined in `src/App.tsx`):

- `/` → `Index.tsx` (redirects based on auth state)
- `/auth` → `AuthPage.tsx`
- `/reset-password` → `ResetPasswordPage.tsx`
- `/app` → `AppDashboard.tsx` (wraps all authenticated views via tabs/sidebar)
- `*` → `NotFound.tsx`

### State Management

- **Global auth state:** `useAuth` context (wraps Supabase session)
- **Server state / data fetching:** TanStack Query (`useQuery`, `useMutation`)
- **Feature data:** Dedicated hooks (`useTasks`, `useHabits`, etc.) that encapsulate Supabase calls
- **UI state:** Local `useState` within components

### Supabase Usage

- Client singleton: `src/integrations/supabase/client.ts`
- DB types auto-generated in `src/integrations/supabase/types.ts` — do **not** hand-edit
- Edge Functions live in `supabase/functions/` (Deno runtime)
- Always use the `supabase` client from `@/integrations/supabase/client`, never re-create it

### Component Guidelines

- **`src/components/ui/`** — shadcn/ui primitives. Do **not** modify these manually; regenerate via `npx shadcn@latest add <component>`.
- **`src/components/app/`** — Feature components. Each View component maps to a major app section and is independently loaded.
- Use the `cn()` helper from `@/lib/utils` for conditional Tailwind classes.
- Always import path alias `@/` instead of relative `../../` paths.

### Styling

- **Tailwind CSS** with CSS custom properties for theming
- **Dark mode** is class-based (`dark` class on `<html>`)
- Theme colors defined as CSS variables in `src/index.css`
- Animations via **Framer Motion** for complex transitions; Tailwind `animate-*` for simple ones
- **Do not** use inline styles — use Tailwind utilities or CSS variables

### TypeScript

- `strict` mode is **off** for developer flexibility
- `noUnusedLocals`, `noUnusedParameters`, and implicit `any` checks are **disabled**
- Path alias: `@/*` → `src/*`
- Target: ES2020

### Linting

- ESLint 9 flat config (`eslint.config.js`)
- Rules: JS recommended + TypeScript recommended + React Hooks + React Refresh
- `@typescript-eslint/no-unused-vars` is **disabled**
- Run `npm run lint` before committing

---

## Testing

- Framework: **Vitest** with `jsdom` environment
- Helper: **@testing-library/react**
- Test files: `src/**/*.{test,spec}.{ts,tsx}`
- Tests run with globals (`describe`, `it`, `expect`) — no explicit imports needed
- Setup file (`src/test/setup.ts`) mocks `window.matchMedia` and extends matchers via `@testing-library/jest-dom`

Test coverage is minimal. When adding tests:
1. Place them alongside the source file or in `src/test/`
2. Mock Supabase calls — never hit real Supabase in tests
3. Mock external hooks with `vi.mock()`

---

## Supabase Edge Functions

Located in `supabase/functions/`, these are **Deno** TypeScript functions:

| Function | Purpose |
|---|---|
| `chat` | Main AI chat endpoint (streams responses) |
| `gmail` | Gmail read/send operations |
| `whatsapp` | WhatsApp messaging |
| `tts` | Text-to-speech (browser API) |
| `elevenlabs-tts` | ElevenLabs premium TTS |
| `test-google-calendar` | Google Calendar OAuth testing |

When editing Edge Functions:
- They use Deno import syntax (`https://deno.land/...`)
- Deploy via Supabase CLI: `supabase functions deploy <name>`
- Secrets are set via `supabase secrets set KEY=value`

---

## Key Integrations

| Integration | Hook | Notes |
|---|---|---|
| Google Calendar | `useGoogleCalendar` | OAuth2; handler in `GoogleCalendarOAuthHandler.tsx` |
| Gmail | `useGmail` | Via Supabase Edge Function |
| WhatsApp | `useWhatsApp` | Via Supabase Edge Function |
| AI Chat | `useAISettings` + `ChatView` | Configurable provider/model in Settings > IA |
| TTS | ElevenLabs / browser | Configurable in AI settings |

---

## PWA Configuration

The app is a Progressive Web App:
- Manifest: `public/manifest.json`
- Icons: `public/icon-192.png`, `public/icon-512.png`
- Service Worker: auto-generated by `vite-plugin-pwa` (auto-update strategy)
- Offline: Google Fonts and static assets cached

---

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| React components | PascalCase | `TasksView.tsx` |
| Custom hooks | camelCase with `use` prefix | `useTasks.ts` |
| Utilities | camelCase | `utils.ts` |
| CSS classes | Tailwind utilities | `className="flex items-center"` |
| Supabase tables | snake_case | `user_tasks` |
| Event handlers | `handle` prefix | `handleSubmit`, `handleDelete` |
| Boolean props/state | `is`/`has` prefix | `isLoading`, `hasError` |

---

## What to Avoid

- **Do not** edit files in `src/components/ui/` — use `npx shadcn@latest` to manage them
- **Do not** re-create the Supabase client — import from `@/integrations/supabase/client`
- **Do not** hand-edit `src/integrations/supabase/types.ts` — regenerate from Supabase CLI
- **Do not** use inline styles — use Tailwind or CSS variables
- **Do not** use relative `../` imports when `@/` alias is available
- **Do not** add new dependencies without clear justification — the bundle is already large
- **Do not** hard-code Supabase URLs or API keys — use `VITE_*` environment variables

---

## Deployment

The project is deployed via **Lovable.dev**:
1. Changes pushed to `master`/`main` sync automatically to Lovable
2. From Lovable IDE: **Share → Publish** deploys to production
3. Custom domains can be configured in Lovable project settings

For local preview of the production build:
```bash
npm run build && npm run preview
```
