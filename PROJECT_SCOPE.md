# PDF Template Generator SaaS - Project Scope

> **Web-based platform** jahan users apne custom PDF templates create karein, dynamic variables define karein, aur API ke through on-demand PDF generate karein.

**Version:** 0.1.0 (scope definition)  
**Stack (planned):** Next.js 16 · React 19 · TypeScript · Supabase (Auth + Postgres) · TanStack Query · Tailwind CSS · shadcn/ui · Zod

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Flow](#2-user-flow)
3. [Landing Page](#3-landing-page)
4. [Authentication](#4-authentication)
5. [Dashboard](#5-dashboard)
6. [Template Management](#6-template-management)
7. [Template Editor](#7-template-editor)
8. [Dynamic Variables](#8-dynamic-variables)
9. [Template Preview](#9-template-preview)
10. [API Key Management](#10-api-key-management)
11. [API Documentation Page](#11-api-documentation-page)
12. [Dynamic Payload Example](#12-dynamic-payload-example)
13. [PDF Generation API](#13-pdf-generation-api)
14. [Variable Injection](#14-variable-injection)
15. [API Response](#15-api-response)
16. [Error Handling](#16-error-handling)
17. [Proposed Data Models](#17-proposed-data-models)
18. [Proposed Routes & Pages](#18-proposed-routes--pages)
19. [Proposed API Endpoints](#19-proposed-api-endpoints)
20. [Implementation Phases](#20-implementation-phases)
21. [Out of Scope (v1)](#21-out-of-scope-v1)

---

## 1. Project Overview

### Kya hai yeh product?

Ek **PDF Template Generator SaaS** jahan:

- User apna account banata hai (email + OTP ya Google).
- Dashboard se **maximum 100 PDF templates** create / edit / delete kar sakta hai.
- Har template me user **apni marzi ke dynamic variables** use karta hai - jaise `{{name}}`, `{{company}}`, `{{salary}}` - koi fixed field list nahi.
- Template save hone ke baad user **API key generate** karta hai.
- External client `FormData` (`form.append`) ke through variable values bhej kar **PDF response** receive karta hai.

### Core value

| Problem | Solution |
|---------|----------|
| Har PDF manually banana | Reusable template + API |
| Fixed form fields | User-defined `{{variable}}` syntax |
| Integration complexity | Simple POST + API key + multipart payload |
| Documentation drift | Auto-generated docs jo template ke saath sync rahein |

### Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Forms | react-hook-form + Zod |
| Auth | Supabase Auth (email/password, Google OAuth, OTP) |
| Database | Supabase PostgreSQL |
| Client data | TanStack React Query |
| PDF engine | TBD - `@react-pdf/renderer`, Puppeteer, or pdf-lib (implementation phase) |
| API auth | Per-user API key (hashed in DB) |

---

## 2. User Flow

```
Landing Page
      ↓
Sign Up (Email) / Sign Up (Google)
      ↓
Email OTP Verification          ← Google users skip OTP
      ↓
Dashboard
      ↓
Create New Template
      ↓
Design PDF Template + Add {{variables}}
      ↓
Save Template → Preview
      ↓
Generate API Key
      ↓
Open Auto-generated API Documentation
      ↓
External client: API Key + FormData variables
      ↓
Receive Generated PDF
```

---

## 3. Landing Page

**Route:** `/` (public)

Ek **simple, clean marketing page** - sirf product introduce karne ke liye. Login ke baad yahan redirect nahi hoga; authenticated users `/dashboard` par jayenge.

### Sections

| Section | Content |
|---------|---------|
| Hero | Product tagline, primary CTA (Sign Up), secondary CTA (Login) |
| Product introduction | Kya karta hai platform - templates, variables, API PDF |
| Features | Template editor, dynamic variables, API keys, auto docs |
| Pricing | Optional - placeholder ya “Coming soon” |
| Contact | Optional - email / form link |
| Footer | Login · Sign Up links |

### CTAs

- **Login** → `/login`
- **Sign Up** → `/sign-up`

> **Note:** Root `/` ab redirect-only nahi hoga - proper landing page banegi.

---

## 4. Authentication

Supabase Auth based. Existing auth routes extend honge.

### Features

| Feature | Route / mechanism | Notes |
|---------|-------------------|-------|
| Sign up (email) | `/sign-up` | Name, email, password |
| Sign up (Google) | Supabase OAuth | OTP skip |
| Login | `/login` | Email + password |
| Logout | `/api/auth/logout` | Session clear |
| Email verification (OTP) | `/verify-otp` (new) | 6-digit OTP email par |
| Resend OTP | API + UI | Rate limited |
| Forgot password | `/forget-password` | ✅ already exists |
| Reset / change password | `/change-password` | ✅ already exists |
| Update profile (name) | `/dashboard/settings` (new) | Display name update |

### Sign up flow (email)

```
1. User enters: name, email, password
2. Account created (unverified state)
3. OTP sent to email
4. User enters OTP on /verify-otp
5. OTP valid → account activated → redirect /dashboard
6. OTP invalid/expired → error message
```

### Sign up flow (Google)

```
1. User clicks "Continue with Google"
2. Supabase OAuth completes
3. Profile created with Google name/email
4. No OTP required → redirect /dashboard
```

### Session & route guards

| Area | Rule |
|------|------|
| `(auth)/*` | Logged-in user → redirect `/dashboard` |
| `(protected)/*` | Guest → redirect `/login` |
| Unverified email user | Block protected routes → redirect `/verify-otp` |
| `/` landing | Public - everyone |

---

## 5. Dashboard

**Route:** `/dashboard` (protected)

Login ke baad user ka home.

### Widgets / sections

| Section | Description |
|---------|-------------|
| Stats cards | Total templates count, API key status (active / not generated) |
| Recent templates | Last 5–10 templates - name, updated date, quick actions |
| Quick actions | **Create Template** button (primary) |
| Navigation | Templates list, API keys, settings |

### Empty state

Agar koi template nahi: illustration + “Create your first template” CTA.

---

## 6. Template Management

**Route:** `/dashboard/templates` (protected)

### Features

| Action | Description |
|--------|-------------|
| Create template | New blank template → editor |
| Edit template | Open existing in editor |
| Delete template | Confirm dialog → soft or hard delete |
| Duplicate template | Optional v1 - copy template + variables |
| Preview template | Read-only render with sample / empty variables |
| View API docs | Per-template documentation page |

### Template limit

- **Maximum 100 templates per user.**
- 100 par create attempt → `Template Limit Reached` error.
- UI me counter dikhe: e.g. `12 / 100 templates`.

### Template fields (logical)

| Field | Description |
|-------|-------------|
| `id` | UUID |
| `user_id` | Owner |
| `name` | User-given template name |
| `content` | Template body (HTML / structured JSON - editor decision) |
| `created_at` | Timestamp |
| `updated_at` | Timestamp |

---

## 7. Template Editor

**Route:** `/dashboard/templates/new`, `/dashboard/templates/[id]/edit` (protected)

Sabse important feature.

### Editor capabilities

- Rich text / block-based layout for PDF content.
- User `{{variable_name}}` syntax type kar sake - autocomplete optional.
- Live list of detected variables (sidebar).
- Save + Save & Preview buttons.

### Example template content

```
Invoice

Customer Name: {{customer_name}}
Invoice Number: {{invoice_number}}
Date: {{date}}
Total Amount: {{amount}}
```

Variables auto-detected: `customer_name`, `invoice_number`, `date`, `amount`.

### Editor UX requirements

- Variable syntax highlight (optional v1).
- Invalid variable names warn karein (e.g. spaces, special chars) - allow `[a-zA-Z0-9_]` only.
- Unsaved changes warning on navigate away.

---

## 8. Dynamic Variables

### Rules

| Rule | Detail |
|------|--------|
| Not predefined | System kisi fixed field list par limited nahi |
| User-defined | User template me jo `{{key}}` likhe, wahi keys expected |
| Auto extraction | Save / edit par server + client dono parse karein |
| Payload sync | Docs + UI example hamesha current variables reflect karein |

### Valid variable name

- Pattern: `{{snake_case_or_camel}}` - alphanumeric + underscore.
- Examples: `{{name}}`, `{{company}}`, `{{employee_id}}`, `{{salary}}`, `{{order_number}}`.

### Storage

Parsed variable names template ke saath store (`variables: string[]`) taake API validation fast ho.

---

## 9. Template Preview

**Route:** `/dashboard/templates/[id]/preview` (protected)

### Purpose

Sirf structure verify karna - layout sahi hai ya nahi.

### Behaviour

- Template render with placeholder values (e.g. `[customer_name]`) ya user-entered sample values.
- PDF preview in browser (iframe / new tab) - implementation detail.
- Preview **API key require nahi karta** - session auth sufficient.

---

## 10. API Key Management

**Route:** `/dashboard/api-keys` (protected)

Har user **ek active API key** (v1 - regenerate replaces previous).

### Features

| Action | Description |
|--------|-------------|
| Generate API Key | First time - show key once (copy prompt) |
| View API Key | Masked display (`pk_****...abc`) |
| Regenerate API Key | Old key invalidate → new key |
| Copy API Key | Clipboard button |

### Security

- Key format: `pk_live_<random>` (prefix TBD).
- **Hashed storage** in DB - plain key sirf generate/regenerate par ek baar dikhe.
- Har PDF generation request me key required.
- Invalid / missing key → `401 Unauthorized`.

---

## 11. API Documentation Page

**Route:** `/dashboard/templates/[id]/docs` (protected)

Har template ke liye **automatically generated** documentation.

### Page content

| Section | Content |
|---------|---------|
| Endpoint | `POST /api/v1/templates/{template_id}/generate` |
| Method | `POST` |
| Headers | `X-API-Key: your_api_key` |
| Content-Type | `multipart/form-data` |
| Required fields | Dynamically listed from template variables |
| Example request | cURL + JavaScript `FormData` snippet |
| Example response | `200` → `application/pdf` binary |
| Error codes | 401, 404, 422 table |

User ko manually payload likhne ki zarurat nahi - system template se derive kare.

---

## 12. Dynamic Payload Example

**Critical requirement:** Jab bhi user template me variable add / remove kare, documentation aur UI example **automatically update** hon.

### Example

Template variables:

```
{{name}}
{{email}}
{{company}}
```

Generated payload example (FormData):

```javascript
const form = new FormData();
form.append("name", "John Doe");
form.append("email", "john@example.com");
form.append("company", "Acme Inc");
```

User adds `{{phone}}` → example instantly becomes:

```javascript
const form = new FormData();
form.append("name", "John Doe");
form.append("email", "john@example.com");
form.append("company", "Acme Inc");
form.append("phone", "+1234567890");
```

### Where it updates

- Template editor sidebar (live)
- Template docs page
- Dashboard template detail panel

---

## 13. PDF Generation API

**Endpoint:** `POST /api/v1/templates/[templateId]/generate`  
**Auth:** API key header (not session cookie)

### Request

| Part | Value |
|------|-------|
| Header | `X-API-Key: pk_live_...` |
| Body | `multipart/form-data` - one field per variable |

### Example

```http
POST /api/v1/templates/550e8400-e29b-41d4-a716-446655440000/generate
X-API-Key: pk_live_xxxxxxxx
Content-Type: multipart/form-data

name=Fahad
company=ABC Software
salary=120000
```

### Server steps

```
1. Validate API key → resolve user_id
2. Load template → verify ownership via key's user
3. Parse expected variables from template
4. Validate all required variables present in FormData
5. Replace {{var}} placeholders with submitted values
6. Render PDF
7. Return application/pdf
```

### Constraints

- **FormData only** for v1 - no JSON body for variable payload.
- Extra unknown fields → ignore ya warn (TBD - recommend ignore).
- Missing required variable → `422 Missing Required Variables`.

---

## 14. Variable Injection

Template:

```
Hello {{name}}

Welcome to {{company}}

Your salary is {{salary}}
```

Payload:

| Field | Value |
|-------|-------|
| `name` | Fahad |
| `company` | ABC Software |
| `salary` | 120000 |

Generated PDF text:

```
Hello Fahad

Welcome to ABC Software

Your salary is 120000
```

### Replacement rules

- Case-sensitive key match.
- Unreplaced variables left as `{{key}}` in output → treat as error in v1 (`422`) ya visible placeholder (recommend **error** for missing values).
- HTML escape / injection safe rendering.

---

## 15. API Response

### Success (`200 OK`)

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="{template_name}.pdf"

<binary PDF bytes>
```

### Error (`4xx` / `5xx`)

```json
{
  "error": "Missing Required Variables",
  "details": {
    "missing": ["phone", "company"]
  }
}
```

---

## 16. Error Handling

### User-facing (UI)

| Error | Message / behaviour |
|-------|---------------------|
| Invalid OTP | “Invalid verification code. Please try again.” |
| Expired OTP | “Code expired. Request a new one.” |
| Template limit reached | “You’ve reached the maximum of 100 templates.” |
| Invalid API key (docs test) | “Invalid API key.” |

### API errors

| HTTP | Error code / message | When |
|------|----------------------|------|
| 401 | `Unauthorized` / `Invalid API Key` | Missing or wrong API key |
| 403 | `Forbidden` | Key valid but template belongs to another user |
| 404 | `Template Not Found` | Invalid template ID |
| 422 | `Missing Required Variables` | FormData missing keys |
| 422 | `Invalid Variable Value` | Validation failed (optional) |
| 429 | `Rate Limit Exceeded` | Too many requests (optional v1) |
| 500 | `PDF Generation Failed` | Render error |

---

## 17. Proposed Data Models

Supabase PostgreSQL tables (draft).

### `profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | FK → `auth.users.id` |
| `full_name` | text | From sign-up |
| `email_verified` | boolean | OTP complete |
| `created_at` | timestamptz | |

### `templates`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | Owner |
| `name` | text | |
| `content` | text / jsonb | Template body |
| `variables` | text[] | Parsed `{{var}}` names |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Constraint:** Count per `user_id` ≤ 100 (DB trigger or app check).

### `api_keys`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | One active per user (v1) |
| `key_hash` | text | bcrypt / sha256 |
| `key_prefix` | text | Last 4 chars for display |
| `created_at` | timestamptz | |

### `otp_verifications` (if not using Supabase built-in only)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `code_hash` | text | |
| `expires_at` | timestamptz | |
| `attempts` | int | Rate limit |

> RLS policies: users read/write own rows only. API route uses service role for key lookup + template fetch.

---

## 18. Proposed Routes & Pages

### Public

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Login |
| `/sign-up` | Email sign up |
| `/verify-otp` | OTP verification |
| `/forget-password` | Forgot password |
| `/change-password` | Reset password |

### Protected (`(protected)/`)

| Route | Purpose |
|-------|---------|
| `/dashboard` | Main dashboard |
| `/dashboard/templates` | Template list |
| `/dashboard/templates/new` | Create template |
| `/dashboard/templates/[id]/edit` | Edit template |
| `/dashboard/templates/[id]/preview` | Preview |
| `/dashboard/templates/[id]/docs` | API documentation |
| `/dashboard/api-keys` | API key management |
| `/dashboard/settings` | Profile (name) update |

### API

| Route | Purpose |
|-------|---------|
| `POST /api/auth/*` | Existing auth + OTP endpoints |
| `POST /api/v1/templates/[id]/generate` | Public PDF generation (API key) |
| `CRUD /api/templates/*` | Session-authenticated template CRUD |
| `POST /api/api-keys/*` | Generate / regenerate key |

---

## 19. Proposed API Endpoints

### Auth (extend existing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up` | Register + send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/google` | OAuth redirect |
| POST | `/api/auth/forget-password` | Request reset |
| POST | `/api/auth/change-password` | Set new password |

### Templates (session auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List user templates |
| POST | `/api/templates` | Create (enforce 100 limit) |
| GET | `/api/templates/[id]` | Get one |
| PATCH | `/api/templates/[id]` | Update content + re-parse variables |
| DELETE | `/api/templates/[id]` | Delete |
| GET | `/api/templates/[id]/preview` | Preview PDF (session) |

### API keys (session auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/api-keys` | Get masked key info |
| POST | `/api/api-keys/generate` | Generate new key |
| POST | `/api/api-keys/regenerate` | Invalidate + new key |

### PDF generation (API key auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/templates/[id]/generate` | FormData → PDF |

---

## 20. Implementation Phases

### Phase 1 - Foundation

- [ ] Landing page (`/`)
- [ ] Google OAuth sign-up / login
- [ ] OTP email verification flow
- [ ] Profile name update
- [ ] Dashboard shell + navigation

### Phase 2 - Templates

- [ ] Template CRUD (100 limit enforced)
- [ ] Template editor with `{{variable}}` parsing
- [ ] Variable list sidebar + live payload example
- [ ] Template preview

### Phase 3 - API & PDF

- [ ] API key generate / regenerate / copy
- [ ] Auto-generated docs page per template
- [ ] PDF generation endpoint (FormData → PDF)
- [ ] Variable injection + validation

### Phase 4 - Polish

- [ ] Error handling completeness
- [ ] Rate limiting (OTP + API)
- [ ] Duplicate template (optional)
- [ ] Pricing section on landing (optional)

---

## 21. Out of Scope (v1)

| Item | Reason |
|------|--------|
| Team / multi-user accounts | Single-user SaaS first |
| Webhook callbacks | PDF returned synchronously only |
| JSON request body for variables | FormData only per requirements |
| Template marketplace / sharing | Private templates only |
| Custom domains | Future |
| Billing / subscriptions | Pricing section optional placeholder |
| Version history for templates | Future |
| Batch PDF generation | Single template per request |

---

## Appendix - Variable Parsing Regex (draft)

```regex
/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g
```

Extract unique capture groups → store as `variables[]` → drive docs payload example + API validation.

---

## Appendix - Existing Codebase Alignment

Already implemented (reuse / extend):

| Feature | Status |
|---------|--------|
| Email login | ✅ `/login` |
| Email sign-up | ✅ `/sign-up` |
| Forgot password | ✅ `/forget-password` |
| Change password | ✅ `/change-password` |
| Dashboard shell | ✅ `/dashboard` |
| Supabase auth services | ✅ `lib/services/auth/*` |
| Route proxy / guards | ✅ `proxy.ts` |

Needs building per this scope:

| Feature | Status |
|---------|--------|
| Landing page | ⚪ |
| Google OAuth | ⚪ |
| OTP verification | ⚪ |
| Template system | ⚪ |
| API keys | ⚪ |
| PDF generation API | ⚪ |
| Auto API docs | ⚪ |

---

*Last updated: 2026-07-21*
