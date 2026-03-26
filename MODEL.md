# Data Models

The system simulates database mechanics directly off the server disk utilizing flat `.json` repositories tracked locally inside `data/`. All reads/writes traverse through locking mechanisms natively implemented within `lib/db.ts` to evade race condition corruption. Structural integrity is bound explicitly using `types/index.ts`.

---

## 1. Users (`users.json`)
Maintains core identity vectors tracking accounts inside the system. 

| Field | Type | Description |
|---|---|---|
| `id` | UUID string | Primary unique identifier mapped physically to system processes. |
| `eid` | string | University mapped internal identifier representing simulated SSO routing. Strictly excluded from standard external APIs to protect PII. |
| `sid` | string / null | User's secondary external student-id mask. Visible to peers on published logs. |
| `name` | string | Real display strings mapped properly for UX mounting. |
| `role` | enum | Strict access tier separating `"regular"` users from `"admin"`. |
| `defaultContact` | object | `{ email: string, phone: string }` nested data capturing permanent settings used actively for "Quick Claims". |
| `passwordHash` | string | Bcrypt stored encryption array protecting initial login gates. |

---

## 2. Posts (`posts.json`)
Stores the dynamic attributes and lifecycle details driving a Lost/Found notice.

| Field | Type | Description |
|---|---|---|
| `id` | UUID string | Identifying trace. |
| `authorId` | UUID string | Foreign linkage matched strictly back to `User.id`. |
| `status` | enum | Lifecycle hook: `pending`, `published`, `rejected`, `claimed`, `cancelled`. |
| `categoryPath` | string[] | Taxonomic path tracing categories down (e.g., `["electronics", "mobile-phones", "apple"]`). |
| `contactInfo` | object | `{ useDefault: boolean, email?, phone? }` dictates overriding logic dynamically for one-off ticket cases. |
| `claimId` | UUID / null | Reverse lookup matching claims correctly against respective origin tickets. |
| `siftDescriptors`| string | Encoded algorithmic matrix mapped implicitly by CV image matching searches. |
| `rejectionReason`| string / null | Populated directly alongside state updates explicitly routing context back to rejected owners. |
| `editNote` | string / null | Track updates issued actively onto published items. |
| `approvedBy` | string / null | Audit hook targeting specific admin identities. |

---

## 3. Claims (`claims.json`)
Isolated event mapping tying third-party requestors to closed resolution instances isolating privacy logic from general posts.

| Field | Type | Description |
|---|---|---|
| `id` | UUID string | Claim reference. |
| `postId` | UUID string | Targeted post. |
| `claimerId` | UUID string | Foreign linkage matched to the person who triggered the claim. |
| `contactEmail` | string | Explicit snapshot of resolution data shared physically back. |
| `contactPhone` | string | Formatted numeric snapshot routing data correctly. |
| `claimedAt` | timestamp | Event hook. |
| `unclaimedBy` | UUID string | Event hook isolating Admin triggers rolling processes back. |

---

## 4. System Logs (`system-logs.json`)
Hardcoded administrative tracking structure providing system visibility mappings mapped inside `/admin/logs/page.tsx`.

| Field | Type | Description |
|---|---|---|
| `id` | UUID string | System ID |
| `action` | string | `post_approved`, `post_rejected`, `post_unclaimed`, `post_cancelled`, `post_updated` |
| `actorId` | UUID string | User running the trigger. |
| `postId` | UUID string | Target modifying unit. |
| `detail` | string | Full string trace mapped physically indicating specific modifications. |
| `createdAt` | timestamp | Event timestamp. |