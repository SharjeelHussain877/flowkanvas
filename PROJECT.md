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
| Settings - General | `app/(protected)/dashboard/settings/page.tsx` | Static UI |
| Settings - Profile | `app/(protected)/dashboard/settings/profile/page.tsx` | Static UI |
| Settings - Security | `app/(protected)/dashboard/settings/security/page.tsx` | Static UI |
| Settings - API Key | `app/(protected)/dashboard/settings/api-key/page.tsx` | Static UI |
| Dashboard routes | `lib/dashboard/routes.ts` | Config |
| Dashboard mock data | `lib/dashboard/mock-data.ts` | Mock |
| Dashboard logout button | `components/dashboard/logout-button.tsx` | Wired |
| Sidebar user menu | `components/dashboard/sidebar-user-menu.tsx` | Static UI |
| Brand logo | `components/brand-logo.tsx` | Shared asset |

## Changelog

### 2026-07-21
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
