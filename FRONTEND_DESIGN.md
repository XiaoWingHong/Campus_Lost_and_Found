# Frontend Design & UI/UX

## 1. Design System
The visual style is characterized by a "Refined Institutional" theme, meant to project university-grade trustworthiness without being overly sterile.

- **Colors:** Dominant Navy (`#1A2744`) representing institutional roots, layered with Accent Amber (`#E8A020`) for focus CTAs. Clean (`#F8F6F2`) off-white bases shape the backdrop.
- **Typography:** Display fonts use *Lora* (Georgia/Serif) for headings to simulate academic distinction. *DM Sans* establishes high legibility for body, menus, and forms.
- **Micro-animations:** Supported systematically using `framer-motion` for smoother page transitions, dialog intros, and interactive hover shifts.

## 2. Key Complex Components
- **`CascadingCategorySelect.tsx` / `CategoryPicker.tsx`:** Complex filter trees to handle extensive multi-level parent > child taxonomy selection (`electronics` -> `phones` -> `ios`). Features integrated breadcrumb paths and search.
- **`ApprovalCard.tsx`:** Exclusively scoped to the admin dashboard combining multiple data points (user SID, item images, post description, and interactive quick-approve/reject flows) into a dense, scalable overview unit.
- **`PostGrid.tsx` & `PostCard.tsx`:** A highly fluid card layout component controlling standard grids. Implements custom skeleton loading patterns for pending network requests.

## 3. Responsive Strategy
The application dictates a fully responsive environment breaking at three core viewport segments (`sm`, `md`, `lg` via Tailwind).

- **Mobile View (< 640px):** Single column standard layout. Top level routing is managed by a bottom-anchored or hamburger navigation sheet (`MobileNav.tsx`) with accessible `DialogTitle` support. Images render in full-bleed aspect ratios.
- **Tablet (640px - 1024px):** Grid converts to two columns. Top-rooted nav bar (`TopBar.tsx`) controls routing.
- **Desktop (> 1024px):** Post grid expands to three columns maximum structure with a fixed left-pinned global `Sidebar.tsx`.

## 4. State Management
- **Routing & Fetching:** Powered via native Next.js fetch strategies natively mapped alongside React `useState`/`useEffect`.
- **Forms:** Advanced multi-step validation processes like "New Post" rely intrinsically on `react-hook-form` connected linearly to strictly parsed `zod` schemas imported statically from `lib/validators.ts`.