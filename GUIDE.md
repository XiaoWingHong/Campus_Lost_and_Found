# Application Guide & Workflows

This document explains the core functionalities and behavioral workflows of the system.

## 1. User Workflows

### Authentication Flow
1. User navigates to `/` (Home page).
2. Clicks "Login" and enters their EID and Password via `/login`.
3. Middleware validates credentials simulating a Campus SSO process and sets an HTTP-only JWT-signed cookie.
4. User is automatically redirected to `/lost-items`.
5. Anonymous users accessing protected routes are redirected back to `/login`.

### Reporting a Lost Item
1. Authenticated user navigates to `/posts/new`.
2. Fills out item details including date, location, description, and uploads images.
3. Selects a classification category using the Cascading Category Picker.
4. User opts to use their "Default Contact" or provide a custom email/phone for the post.
5. On submit, the post is saved locally as `pending` and placed in the administrative review queue.

### Claiming an Item
1. Any authenticated user (excluding the original post creator) views an item detail page (`/lost-items/[id]`).
2. They click "Claim this Item", providing their direct contact info.
3. The post's state switches immediately to `claimed`.
4. The system logs the claim event, notifying the parties off-platform (simulated).

---

## 2. Post Lifecycle (State Machine)

Posts move strictly through predefined states restricting what operations can be done:

1. **Pending:** Submitted by a user. Awaiting admin review. Visible only to author and admins.
2. **Published:** Approved by admin. Visible in public search feeds. Can be claimed.
3. **Rejected:** Admin declines the submission (mandatory reason supplied). User can review the reason but must resubmit as a new post to try again.
4. **Claimed:** User files a claim providing contact info. Admin handles physical exchange validation offline.
5. **Cancelled:** Owner or admin forcibly removes the post from active circulation. Terminated state.

*Admins have the capability to "Unclaim" a post via the `/admin` controls, reverting it back to `published` if a physical handover ultimately fails or was mistakenly triggered.*

---

## 3. Search & Image SIFT Integration

The application supports intelligent optical lookups using the Scale-Invariant Feature Transform (SIFT) algorithm:

1. **Initiation:** Users upload a query photo using the `ImageSearchUpload` component located on the main `/lost-items` page.
2. **Analysis:** The user's client posts the raw buffer to `/api/posts/search/image`.
3. **Execution:** The server evaluates the image's SIFT key points and descriptors against pre-encoded datasets attached to all `published` items.
4. **Result:** High-affinity matching items pass a Euclidean threshold and are mapped directly into the grid UI for user review.