# SPES Swiftpace Engineering Solutions Limited — Corporate Web Platform

A corporate web application and integrated administrative system built for **SPES Swiftpace Engineering Solutions Limited** (RC: 8978524).

---

## 1. Company Information & Brand Identity

- **Company Name:** SPES Swiftpace Engineering Solutions Limited
- **Registration Number:** RC 8978524
- **Registered Headquarters:** Plot 2, Toluwani Street, Peace Avenue, Off Iworoko Road, Ado Ekiti, Ekiti State, Nigeria
- **Official Email:** spesengineeringlimited@gmail.com
- **Telephone Lines:**
  - Primary: `+234 901 075 3592`
  - Secondary: `+234 707 636 5837`
- **WhatsApp Desk:** `https://wa.me/2349010753592`

---

## 2. Platform Architecture

- **Frontend:** React 19 + TypeScript + Tailwind CSS (v4)
- **Design System:** Bespoke dark navy corporate aesthetic (`#06152F`, `#081D43`, `#063B85`, `#12BCEB`, `#078A43`), high-contrast typography, luxury editorial serif headings (`Cormorant Garamond` / `Cinzel`), clean body font (`Plus Jakarta Sans`), and anti-pill discipline.
- **Backend:** Node.js + Express.js full-stack integration (`server.ts`).
- **Database:** SQLite (`data/spes_database.sqlite`) via `better-sqlite3` with WAL mode and automated migration/seeding.
- **Storage:** Local persistent file storage (`uploads/` subdirectories: `projects`, `blog`, `attachments`, `media`).
- **Security:** Password hashing via `bcryptjs`, JWT session cookies (`spes_admin_token`), input validation, anti-bot honeypots, and sanitization.

---

## 3. Public Routes

- `/` — Corporate Homepage (Cinematic hero, 6-discipline showcase, built environment capabilities, featured projects, 6-stage delivery process, why choose SPES, blog feed, FAQ preview, contact CTA)
- `/about` — About Us (Vision, Mission, Core Values, Multidisciplinary Team Structure, Corporate CAC Credentials, Sister company reference context)
- `/services` — Services Directory
- `/services/architecture` — Architecture Discipline
- `/services/building-construction` — Building Construction Discipline
- `/services/civil-structural-engineering` — Civil & Structural Engineering Discipline
- `/services/construction-management` — Construction Management Discipline
- `/services/consultancy` — Technical Consultancy Discipline
- `/services/allied-services` — Allied Services Discipline
- `/portfolio` — Portfolio with Category Filters (Architecture, Building Construction, Civil & Structural, Infrastructure, Commercial & Industrial, Construction Management)
- `/projects/:projectSlug` — Dynamic Case Study (Technical Approach, Scope of Work, Objectives, Outcomes, Gallery Lightbox, Related Projects)
- `/blog` — Engineering Insights & Perspectives with search and category filtering
- `/blog/:articleSlug` — Editorial Reading View (Word count, read time, markdown formatting, social sharing, related insights)
- `/blog/category/:categorySlug` — Category-filtered blog view
- `/contact` — Contact Desk & Project Brief Form (Support for CAD/PDF drawing uploads up to 15MB, interactive contact details, WhatsApp direct, phone links)
- `/faq` — Categorized FAQ (20 questions across Company, Services, Project Engagement, and General Enquiries)
- `/privacy-policy` — NDPA-compliant data privacy disclosures
- `/terms-and-conditions` — Professional engineering engagement terms

---

## 4. Administration System

Access URL: `/admin` or `/admin/login`

### Default Initial Credentials:
- **Username / Email:** `spesadmin` or `spesengineeringlimited@gmail.com`
- **Initial Password:** `AdminSecure2026!`
*(Administrators can update this password in the Settings section at any time).*

### Administrative Capabilities:
1. **Dashboard (`/admin/dashboard`):** Real-time project counts, published/draft status, blog metrics, total/new client enquiries, and recent submission logs.
2. **Projects Manager (`/admin/projects`):** Create, edit, publish/unpublish, and delete projects. Upload cover and multiple gallery images, set scope of work, technical approach, and featured status.
3. **Blog Manager (`/admin/blog`):** Draft, edit, publish/unpublish technical articles with markdown content, excerpts, categories, author bylines, and SEO metadata.
4. **Client Enquiries (`/admin/enquiries`):** Comprehensive inquiry review, search and filtering by service/status (New, Contacted, In Discussion, Quoted, Converted, Closed), internal notes management, attachment downloading, and CSV export.
5. **Media Library (`/admin/media`):** Centralized asset upload, file URL copying, and management.
6. **Settings (`/admin/settings`):** Update company phone numbers, email, headquarters address, WhatsApp hotlines, and administrator password.

---

## 5. Deployment Instructions

1. Ensure Node.js 20+ is installed on the host.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build frontend assets:
   ```bash
   npm run build
   ```
4. Start the full-stack server:
   ```bash
   npm start
   ```
5. SQLite database files and uploads are stored in `./data/` and `./uploads/`. Ensure these directories reside on persistent disk volumes.

---

## 6. Netlify PostgreSQL & Blobs Migration Runbook

### Target Isolation & Safety Rules

- **Explicit Target Required:** Every database schema migration (`npm run db:migrate`), SQLite-to-PostgreSQL import (`npm run migrate:pg`), media upload (`npm run migrate:blobs`), verification (`npm run verify:migration`), and backup (`npm run backup:pg`, `npm run backup:blobs`) requires `--target=preview` or `--target=production`. There is **no default target**.
- **Target-Specific Database URLs:** CLI scripts resolve `NETLIFY_PREVIEW_DB_URL` (or `--db-url`) for `preview` and `NETLIFY_PROD_DB_URL` (or `--db-url`) for `production`, and **never** fall back silently to generic `NETLIFY_DB_URL`. Cross-environment URLs or `--target=production` inside Deploy Preview contexts are blocked.
- **Netlify Blobs Region (`eu-central-1`):** All runtime and CLI Blob stores explicitly use `eu-central-1` (Frankfurt):
  - Production: `spes-media-prod`
  - Deploy Preview / branch deploys: `spes-media-preview` (with optional read-only fallback to `spes-media-prod` controlled by `ALLOW_PREVIEW_PROD_BLOB_READ`)
  - Local development: `spes-media-dev`

### Required Source Files & WAL Handling

- **SQLite Database (`data/spes_database.sqlite`):** Opened strictly read-only (`{ readonly: true }`) during dry runs and migrations. Because SQLite runs in **WAL mode**, uncheckpointed writes reside in `data/spes_database.sqlite-wal` alongside `data/spes_database.sqlite-shm`. Always keep `.sqlite`, `.sqlite-wal`, and `.sqlite-shm` together in the same directory when migrating.
- **Media Uploads (`uploads/`):** Original project, blog, and media files must remain in `uploads/` (`projects/`, `blog/`, `media/`). Static brand assets remain in `public/assets/`.

### Preview Migration Sequence (Zero-Corruption Order)

1. **Protect Initial Preview Boot (`SKIP_PG_BOOTSTRAP=true`):**
   Set `SKIP_PG_BOOTSTRAP="true"`, `NETLIFY_BLOB_REGION="eu-central-1"`, and `JWT_SECRET` (≥ 32 chars) in the Netlify **Deploy Preview** environment before any preview API request runs. This prevents `ensurePgBootstrapped()` from creating default `admins`, `website_settings`, or `blog_categories` rows ahead of SQLite import.
2. **Run Safe Preview Dry Runs First:**
   ```bash
   NETLIFY_PREVIEW_DB_URL="postgresql://<PREVIEW_URL>" npm run db:migrate -- --target=preview --dry-run
   NETLIFY_PREVIEW_DB_URL="postgresql://<PREVIEW_URL>" npm run migrate:pg -- --target=preview --dry-run
   NETLIFY_PREVIEW_DB_URL="postgresql://<PREVIEW_URL>" npm run migrate:blobs -- --target=preview --dry-run
   ```
3. **Apply Drizzle Schema to Preview Branch:**
   ```bash
   NETLIFY_PREVIEW_DB_URL="postgresql://<PREVIEW_URL>" npm run db:migrate -- --target=preview
   ```
4. **Import Original SQLite Data & Verify Admin Credentials / FKs:**
   ```bash
   NETLIFY_PREVIEW_DB_URL="postgresql://<PREVIEW_URL>" npm run migrate:pg -- --target=preview
   ```
5. **Upload Media to `spes-media-preview` (`eu-central-1`) with SHA-256 Read-Back Verification:**
   ```bash
   NETLIFY_SITE_ID="<SITE_ID>" \
   NETLIFY_AUTH_TOKEN="<TOKEN>" \
   NETLIFY_PREVIEW_DB_URL="postgresql://<PREVIEW_URL>" \
   npm run migrate:blobs -- --target=preview
   ```
6. **Run Read-Only Post-Migration Verification:**
   ```bash
   NETLIFY_SITE_ID="<SITE_ID>" \
   NETLIFY_AUTH_TOKEN="<TOKEN>" \
   NETLIFY_PREVIEW_DB_URL="postgresql://<PREVIEW_URL>" \
   npm run verify:migration -- --target=preview --check-blobs
   ```
7. **Re-enable Idempotent Runtime Bootstrap (`SKIP_PG_BOOTSTRAP=false`):**
   Only after `verify:migration` confirms 100% count, credential, and media parity, remove `SKIP_PG_BOOTSTRAP` (or set it to `false`) on the Deploy Preview environment.

### Safe Backups, Recovery & Rollback

- Preview and production backups isolate into `backups/preview/<timestamp>/` and `backups/production/<timestamp>/`:
  ```bash
  NETLIFY_PREVIEW_DB_URL="postgresql://<PREVIEW_URL>" npm run backup:pg -- --target=preview
  NETLIFY_SITE_ID="<SITE_ID>" NETLIFY_AUTH_TOKEN="<TOKEN>" npm run backup:blobs -- --target=preview
  ```
- Legacy `data/spes_database.sqlite*` and `uploads/` remain read-only untouched sources; if preview migration fails or seeds conflict, reset only the preview Neon branch and re-run Steps 3–6 with `SKIP_PG_BOOTSTRAP=true`.

