# Files Index

This document outlines the purpose of each key file in the workspace to aid in codebase navigation.

## Application Root
- `package.json` / `next.config.ts` / `tsconfig.json` / `tailwind.config.ts`: Standard Next.js and Node.js project configuration models.
- `middleware.ts`: Next.js edge middleware. Intercepts routes evaluating session/JWT cookies determining access blocks targeting protected sub-trees (`/app/(app)/*`).

## `app/` Directory (App Router Routes)
*Next.js 15 routing folder structure driving page-level component rendering.*

### Unauthenticated `app/(public)/`
- `page.tsx`: Initial index hitting Landing Page structures natively.
- `login/page.tsx`: Simulated login interface hooking SSO flows directly.

### Authenticated Routes `app/(app)/`
- `layout.tsx`: Base wrapper driving UI Shells containing `Sidebar` & `TopBar` nav mounts.
- `lost-items/page.tsx`: Primary index rendering searchable matrices mapping out published items dynamically.
- `lost-items/[id]/page.tsx`: Specific view drilling deeper into images & claim logic for tickets.
- `posts/new/page.tsx`: Complex mapping pushing fresh schema payload directly into queue arrays.
- `posts/my-posts/page.tsx`: Custom dashboard scoping DB queries actively to matching specific user identities.
- `posts/[id]/edit/page.tsx`: Form routing mapped mutations against live items without triggering resets.
- `claimed/page.tsx`: Public list enumerating strictly closed out resolution items globally.
- `settings/page.tsx`: Basic parameter editing form routing user configurations (email/phone defaults).

### Admin Sub-Layout `app/(app)/admin/`
- `approvals/page.tsx`: Primary moderation UI fetching specifically `pending` objects handling rapid triage functions.
- `posts/page.tsx`: Complete index mapped actively replacing native layouts enabling broad edits universally.
- `users/page.tsx`: Identity registry handling role overrides toggles dynamically.
- `logs/page.tsx`: Tabular mapping explicitly listing generated audit traces natively parsing actions chronologically.

### Route Handlers `app/api/`
- `auth/*`: Native handlers mutating tokens correctly via login, logout endpoints.
- `posts/route.ts` & `[id]`: Main transactional arrays pulling/saving object parameters correctly against `lib/db`.
- `posts/search/image/route.ts`: Algorithmic trigger invoking the SIFT library targeting query buffer images appropriately.
- `upload/route.ts`: Handling binary streams managing disk logic moving chunks out directly onto `/public/uploads`.

## `components/` Directory
*React stateless logic isolating generic layouts enabling better composability.*

- `admin/`: Admin UI mapping `ApprovalCard` & `UserTable` structures explicitly containing robust handler buttons.
- `layout/`: App Shell primitives `Sidebar`, `TopBar`, & responsive sheet handling via `MobileNav.tsx`.
- `posts/`: Ticket visuals capturing details cleanly including `PostGrid`, `PostForm`, modular `ClaimDialog` primitives hooking notifications, and global `StatusBadge.tsx`.
- `search/`: Navigation mapping parsing out detailed taxonomies utilizing `CascadingCategorySelect.tsx`, global `SearchBar`, & logic driven visually using `ImageSearchUpload.tsx`.
- `ui/`: Local shadcn primitives (tailored `Button`, `Dialog`, `Avatar`, etc.) handling native design aesthetics organically formatted safely cleanly.

## Scripts & Configurations
- `scripts/seed.ts`: Standalone execution handler generating pre-filled JSON testing arrays cleanly for rapid onboarding structures natively.
- `types/index.ts`: Strongly typed interfaces enforcing strict compilation logic matching model attributes perfectly (`User`, `PostWithAuthor`).
- `lib/db.ts`: Physical disk I/O wrapper enforcing safe read/write processes securely mapped over asynchronous arrays cleanly parsing `.json` data.
- `lib/sift.ts`: Abstracted visual execution mappings handling complex array transformations algorithmically formatting vectors back into memory scopes.
- `lib/auth.ts`: Authentication primitives mapping out signed token handlers dynamically enforcing system states properly across multiple requests securely.