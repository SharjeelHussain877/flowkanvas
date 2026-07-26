# flowkanvas

## Element registry

| Element | Path | Status |
|---------|------|--------|
| Dashboard shell | `components/dashboard/dashboard-shell.tsx` | Static UI |
| App sidebar (memo) | `components/dashboard/app-sidebar.tsx` | Static UI |
| Sidebar nav link | `components/dashboard/sidebar-nav-link.tsx` | Static UI |
| Dashboard page wrapper | `components/dashboard/dashboard-page.tsx` | Static UI |
| Dashboard back navigation | `lib/dashboard/back-navigation.ts` | Config |
| Dashboard loading | `components/dashboard/dashboard-loading.tsx` | Static UI |
| Requests page | `app/(protected)/dashboard/requests/page.tsx` | Static UI |
| Projects page | `app/(protected)/dashboard/projects/page.tsx` | Static UI |
| Template page | `app/(protected)/dashboard/templates/[slug]/page.tsx` | Static UI |
| Settings | `app/(protected)/dashboard/settings/page.tsx` | Wired (profile + security + invites) |
| Settings profile API | `app/api/settings/profile/route.ts` | Wired |
| Settings profile form | `app/(protected)/dashboard/settings/_components/profile-section.tsx` | Wired |
| Settings change password | `app/(protected)/dashboard/settings/_components/change-password-section.tsx` | Wired |
| Settings password API | `app/api/settings/password/*` | Wired |
| Settings sessions | `app/(protected)/dashboard/settings/_components/sessions-section.tsx` | Wired |
| Settings sessions API | `app/api/settings/sessions/*` | Wired |
| Session services | `lib/services/sessions/*` | Wired |
| Supabase schema migration | `supabase/migrations/20260726000000_flowkanvas_schema.sql` | SQL |
| Invite services | `lib/services/invites.ts` | Wired |
| Settings - API Keys | `app/(protected)/dashboard/settings/api-keys/page.tsx` | Wired |
| API keys services | `lib/services/api-keys/*` | Wired |
| API keys routes | `app/api/api-keys/*` | Wired |
| API key auth | `lib/api/authenticate-api-request.ts` | Wired |
| Dashboard routes | `lib/dashboard/routes.ts` | Config |
| Dashboard mock data | `lib/dashboard/mock-data.ts` | Mock |
| Dashboard logout button | `components/dashboard/logout-button.tsx` | Wired |
| Sidebar user menu | `components/dashboard/sidebar-user-menu.tsx` | Static UI |
| Brand logo | `components/brand-logo.tsx` | Shared asset |

## Changelog

### 2026-07-26 (change password)
- Settings: debounced current-password verification; **Update password** enables after current password is valid and new password + confirm match requirements.
- New/confirm password inputs stay disabled until current password verifies; field labels stay normal on error (red text below only).
- Profile + change password UI state (`isEditing`, verification status) moved into react-hook-form fields instead of `useState`.
- Change password: show/hide toggles on new + confirm password fields (Eye icon).

### 2026-07-26 (sessions dedupe)
- Active sessions list merges duplicate device rows (same device/browser/IP); sign out revokes all matching sessions.

### 2026-07-26 (sessions)
- Settings: real **Active sessions** list from `auth.sessions` (device, browser, IP, last active); revoke one session or all other devices; logout uses `local` scope for multi-device sign-in.

### 2026-07-26 (no toasts)
- Removed `sonner` and all toast notifications; copy/save feedback uses inline UI state only.

### 2026-07-26 (auth-only users)
- Removed `public.profiles` table; all profile and invite data lives in Supabase Auth `user_metadata` only.
- Consolidated migrations into `supabase/migrations/20260726000000_flowkanvas_schema.sql` (API keys, avatars storage, invite count RPC).

### 2026-07-26 (auth avatar)
- Profile photo sync writes `avatar_url`, `avatarUrl`, and `picture` to Supabase Auth `user_metadata` for Auth dashboard avatars.

### 2026-07-26 (invites)
- Settings: **Copy invite link** button; referral URL `/sign-up?ref={userId}`; sign-up stores `invited_by` in invitee auth metadata; profile card shows invite count via `get_my_invite_count()`.

### 2026-07-26 (later)
- Settings: merged Profile into `/dashboard/settings`; removed Profile from dropdown nav; legacy `/settings/profile` redirects to main settings page.

### 2026-07-26
- API Keys: Supabase `api_keys` table with RLS, secure generation (`pdf_sk_live_*`), SHA-256 storage, list/create/revoke API routes, Settings UI with one-time secret modal, and revoke confirmation.
- Profile settings: merged Security (password + sessions) into Profile page; removed Security from settings dropdown; legacy `/settings/security` and `/settings/api-key` redirect.

### 2026-07-21
- Landing page: unified section spacing tokens (`py-16 sm:py-20 lg:py-24`, shared container/grid/body gaps); fixed horizontal scroll; trust bar bullets stack in a column on mobile.
- Dashboard layout: shadcn sidebar shell in `(protected)/layout.tsx` - memoized client sidebar persists across navigations; only page content swaps.
- Dashboard pages (static UI): Requests, Projects, template detail, Settings (General, Profile, Security), Generate API Key.
- Sidebar menu: Requests, collapsible Projects + Recents (24 draft templates), Settings submenu in footer.
- Root layout: `TooltipProvider` for shadcn sidebar tooltips.
- Brand logos: `logo.png` in home navbar + auth header + expanded sidebar; `logosquare.png` in collapsed sidebar icon mode via `components/brand-logo.tsx`.
- Dashboard shell: removed navbar vertical separator; sidebar header keeps fixed `h-12` in collapsed and expanded states.
- Dashboard navbar: sticky top bar with backdrop blur on scroll.
- Sidebar header logos: full `object-contain` within fixed `h-12` header slot.
- Sidebar: Projects is a flat nav link; only Recents keeps collapsible draft list.
- Sidebar footer: profile row with shadcn dropdown menu (`side="top"`) for settings links.
- Dashboard navbar: top-right logout icon (red) opens white confirm dialog; outside click or close dismisses; friendly sign-out message before `/api/auth/logout`.
- Landing page: removed pricing section; nav links Features + How It Works only.
- Landing page: lazy below-fold sections via `LazySection` (Intersection Observer) - only nav + hero render on initial load; nav anchor clicks force-mount target sections.
- Root layout: `suppressHydrationWarning` on `<html>` and `<body>` to tolerate browser extensions that inject attributes (e.g. `cz-shortcut-listen`) before hydration.
- Email verify callback: `getEmailVerificationCallbackUrl()` → `http://localhost:3000/api/auth/confirm?next=/dashboard`; post-verify redirect via `NEXT_PUBLIC_EMAIL_VERIFY_REDIRECT` (default `/dashboard`).
- Sign-up success redirects to `/login?notice=confirm_email` (email confirm) or `/dashboard` (instant session); proxy auth lookup timeout prevents page hang when Supabase is slow.
- Auth group: home-style typography mix - `font-sans` body, `font-serif` card titles + italic tagline accent.
- Auth layout: larger center-aligned header logo (`h-16`, `max-w-[18rem]`).
- Dashboard pages: back arrow + title in one row, serif page titles, Open Sans via `font-sans` on shell + global `--font-sans`.
- Rebrand: project name `CanvasFlow` → `flowkanvas` across UI, docs, and package metadata.
- Auth header tagline: smaller sans (`text-xs`), tighter width + line-height.
- Brand palette in `globals.css`: navy `#11172a`, slate `#626c7d`, teal `#599692`, mist `#dfe5ec` - mapped to shadcn + brand tokens app-wide.
- Email inputs auto-lowercase on type (Input) and on validate (Zod `emailField` + search param helpers).
