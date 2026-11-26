# flowkanvas

Design a PDF once, generate it a thousand times through an API.

Users build templates in a canvas editor (any page size, multiple pages), mark the parts that
change with `{{variables}}`, and call one endpoint with a JSON or form-data payload to get the
finished PDF back. Typical uses: certificates, tickets, ID cards, vouchers, labels, letters.

## Features

- **Canvas editor**: text, images, shapes (rectangle, ellipse, triangle, star, diamond, hexagon),
  lines, 117 icons, QR codes and barcodes (Code 128, EAN-13). Multi-select, groups, snap guides,
  align and distribute, undo/redo, copy/paste, multiple pages, keyboard shortcuts.
- **Variables**: `{{name}}` inside text, QR codes and barcodes; image slots bound to a variable;
  visibility conditions that show or hide an element depending on a payload value.
- **Text never overflows**: text boxes shrink long values to fit by default.
- **Assets**: upload images and fonts once in the side sheet and reuse them in every template.
  Images can be cropped to any shape. Custom `.ttf` / `.otf` fonts are embedded in the PDF.
- **Starters**: certificate, event ticket, ID card, gift voucher, product label, offer letter,
  business card.
- **API**: API keys, rate limits, request log, and an in-app tester that calls the same endpoint.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui, React Query, Zod,
Supabase (auth, Postgres, storage), `@react-pdf/renderer` for PDF output, `sharp` for image
masking, `fontkit` for font metadata.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` (see the variables below) pointing at your Supabase project.

3. Apply the database migrations (tables, storage buckets and policies):

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

### Environment variables

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Anon / publishable key (used by the server for user sessions) |
| `SUPABASE_SECRET_KEY` | Service role key (server only; API-key requests and logs) |
| `NEXT_PUBLIC_SITE_URL` | Public URL of this app, used in emails and API examples |
| `NEXT_PUBLIC_EMAIL_VERIFY_REDIRECT` | Optional path to open after email verification |

Never expose the secret key to the browser.

## Using the editor

1. **Templates → Create Template**: pick a starter or a blank page size.
2. **Left rail**: add text, variable text, images (opens Assets), shapes, icons, QR codes and
   barcodes. The Assets sheet holds your uploaded images and fonts; click an image to place it.
3. **Right panel**: properties of the selected element, alignment, visibility condition and layer
   order. With nothing selected it shows the page size and background.
4. **Bottom strip**: pages. Add, duplicate, reorder and delete.
5. **API tab**: the variables found in the design, the endpoint, an example payload and cURL
   commands. **Test API** generates a real PDF from the saved design.

Shortcuts: ⌘S save, ⌘Z / ⌘⇧Z undo and redo, ⌘A select all, ⌘C / ⌘V copy and paste, ⌘D
duplicate, ⌘G / ⌘⇧G group and ungroup, arrows nudge (⇧ for 10px), ⌫ delete, ⌥ while dragging
turns snapping off.

## Using the API

Create a key under **Settings → API Keys**, then:

```bash
# JSON
curl -X POST https://your-app/api/v1/templates/TEMPLATE_ID/generate \
  -H "Authorization: Bearer pdf_sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"payload":{"name":"Ayesha Khan","course":"Design 101","vip":"yes"}}' \
  --output certificate.pdf

# form-data (text fields + image files)
curl -X POST https://your-app/api/v1/templates/TEMPLATE_ID/generate \
  -H "Authorization: Bearer pdf_sk_live_..." \
  -F "name=Ayesha Khan" \
  -F "photo=@/path/to/photo.jpg" \
  --output id-card.pdf
```

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/templates` | Your templates with their variables (`text`, `images`, `conditions`) and page count |
| `GET /api/v1/templates/:id` | One template plus an `example_payload` |
| `POST /api/v1/templates/:id/generate` | Returns `application/pdf` |

- Image variables accept files in form-data, or a URL / `data:` URI in JSON (PNG or JPEG, up to 10 MB).
- Condition variables only show or hide elements; send any non-empty value to show.
- `?inline=1` returns the PDF for display instead of download.
- Missing variables are listed in the `X-Flowkanvas-Missing-Variables` response header;
  non-fatal issues (skipped image, missing font, invalid barcode value) in `X-Flowkanvas-Warning`.
- Limits: 30 generate calls per minute per account.

Every call is logged on **Requests** with status and duration.

## Project structure

```
app/(protected)/dashboard/templates   Templates list, new-template gallery, editor ([id])
app/api/templates, app/api/assets,     Session APIs used by the dashboard
app/api/fonts, app/api/requests
app/api/v1/templates                   Public API (API key)
components/templates                   Design renderer, glyphs, assets sheet, API tester
lib/templates                          Design helpers: schema utils, fonts, shapes, snapping,
                                       alignment, conditions, QR, starters, icon catalog
lib/barcodes                           Code 128 and EAN-13 encoders
lib/pdf                                react-pdf document, renderer, image resolver and masking
lib/services                           Supabase access (templates, assets, fonts, API keys, logs)
schemas                                Zod schemas and shared types (design JSON lives here)
supabase/migrations                    Database, storage buckets and RLS policies
scripts/generate-icon-catalog.mjs      Regenerates lib/templates/icon-catalog.ts from lucide
```

`PROJECT.md` lists every element of the app and the changelog; read it before changing code.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
node scripts/generate-icon-catalog.mjs   # refresh the icon catalog
```
