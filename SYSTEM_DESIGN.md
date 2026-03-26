# System Architecture & Design

## 1. Technology Stack
- **Framework:** Next.js (App Router) v15.x
- **Language:** TypeScript (strict mode `tsconfig.json`)
- **Core Styling:** Tailwind CSS v4
- **UI Components:** Radix UI primitives wrapped via `shadcn/ui`
- **Forms & Validation:** React Hook Form + Zod
- **Iconography:** Lucide React
- **Image Processing:** SIFT for visual matching (via `lib/sift.ts` integrating node modules)
- **Data Layer:** Flat-file JSON approach local to the server (`data/` folder).

## 2. Architecture Model
The system follows a monolith React model deployed on node engines.
- **Frontend / View Layer:** Composed strictly utilizing the Next.js App Router RSC (React Server Components) and React Client Components for stateful UX pages.
- **Backend Handlers:** Next.js Route Handlers (`app/api/*`) operate as stateless, REST-style proxies that process requests, validate cookies, and read/write to the backend service.
- **Database Proxy:** `lib/db.ts` acts as the repository abstraction handling JSON flat-file concurrency safely.

## 3. Access Control & Security Settings
- **Authentication:** Sessions driven by JWT-signed cookies tracking `userId`, `role`, and `exp`.
- **Edge Guard:** The Next.js `middleware.ts` evaluated universally at the edge, blocking unauthorized requests dynamically. Restricts non-authed sessions exclusively to `/` and `/login`.
- **Role-Based Access Control (RBAC):** Users carry roles of `"regular"` vs `"admin"`. Sub-routing into `/admin/*` throws 403 blocks for unauthorized visitors.
- **Data Privacy Rules:**
  - **EID Protection:** The internal SSO identifier (`eid`) is tightly locked down for privacy reasons. It is never emitted back onto public APIs.
  - **SID Display:** Users' globally recognized Student Identifier (`sid`) handles public attributions and validation.
- **Upload Restrictions:** System endpoints lock file uploads to images only (strictly jpeg/png), max 5MB per buffer, explicitly checking format constraints preventing malicious shell scripting payloads.

## 4. System Extensibility
While developed directly using flat-file `lib/db.ts` methodologies for ease of rapid prototyping, the JSON DB layer serves as an adapter blueprint. When migrating endpoints to a production cloud SQL schema, developers solely replace `db.ts` without modifying higher route handlers (`api/*`).
