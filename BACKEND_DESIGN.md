# Backend Design & API Routing

This document specifies the routing structures, backend logic, and handler endpoints operating the system via Next.js Route Handlers (`app/api/*`). Secure context is inferred systematically by matching JWT signatures on inbound calls setup at Edge (`middleware.ts`).

---

## 1. Authentication Endpoints (`/api/auth`)
- `POST /api/auth/login`: Accepts simulating login `{ eid, password }`. Validates bcrypt-hashed password natively and produces signed JWT session cookie holding `userId`, `role`.
- `POST /api/auth/logout`: Instructs the client browser to immediately expire the HTTP-only tracking cookie, effectively nullifying the session.
- `GET /api/auth/me`: Decodes current token returning mapped `User` data directly to clients for contextual mounting (Nav icons, admin tabs).

---

## 2. Post Lifecycle Endpoints (`/api/posts`)
Handles strict CRUD state transitions for lost item tickets.

- `GET /api/posts`: Queries posts. Supports complex parameter decoding via query string (`?q=phone&category=tech&status=published&page=1&limit=12`).
- `POST /api/posts`: Handles new post initiation binding standard states to `pending`. Checks payload thoroughly via Zod.
- `GET /api/posts/[id]`: Pulls exact item details dynamically mapping related nested author `sid` elements alongside it.
- `PUT /api/posts/[id]`: Restricted strictly to `Owner`/`Admin`. Mutates current definitions specifically.
- `DELETE /api/posts/[id]`: Transitions explicit `status` state effectively locking post as `cancelled`.

**Action Based Methods (Admin / Workflows):**
- `POST /api/posts/[id]/approve`: Mutates from `pending` -> `published`.
- `POST /api/posts/[id]/reject`: Mutates from `pending` -> `rejected` demanding a valid accompanying `reason`.
- `POST /api/posts/[id]/claim`: Mutates from `published` -> `claimed` processing `contactPhone` data.
- `POST /api/posts/[id]/unclaim`: Administrative rollback reversing `claimed` state cleanly back to active `published` statuses tracking timestamps dynamically.

---

## 3. Operations & User Governance
- `GET /api/users` & `GET /api/users/[id]`: Fetches profiles mapping out critical admin-sensitive logic cleanly without leaking native `.json` configurations.
- `PUT /api/users/[id]`: Upgrades basic metrics like custom `defaultContact` parameters, or handles administrative `role` overrides toggling a user to `Admin`.
- `GET /api/admin/logs`: Access point evaluating strictly the system-wide logging arrays returning `post_cancelled`, `post_approved` telemetry cleanly parsed and structured back to administrative dashboards.

---

## 4. Complex Sub-Systems
- **Upload API (`POST /api/upload`)**: Manages `multipart/form-data`. Filters incoming bytes against permitted mime types converting valid chunks safely into persistent OS static assets linked physically via `UUID` directories.
- **Image Matcher (`POST /api/posts/search/image`)**: Intercepts uploaded query buffers passing raw image matrices explicitly to the `lib/sift.ts` pipeline scoring resulting vector models against `.json` stored array parameters.