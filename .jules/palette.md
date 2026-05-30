## 2024-05-26 - Improved Search Command UI and Button Hover States
**Learning:** Adding subtle hover states to sidebar action buttons (like "Create List") provides essential interaction feedback that is often missed in standard shadcn ghost buttons. Furthermore, rendering a global search trigger with exact input styling (icons, padding, layout) instead of looking like a basic button drastically improves the user's immediate understanding of the component's purpose.
**Action:** Always verify that interactive non-primary actions have clear visual feedback on hover (`hover:bg-muted/50 transition-colors`). Ensure fake inputs acting as dialog triggers perfectly mimic real input styling to maintain user expectations.
## 2024-05-27 - Added native tooltips to truncated UI text
**Learning:** When using text truncation classes (like Tailwind's `truncate`) on dynamic or long text elements (like list or label names), the hidden text becomes inaccessible to sighted users who cannot rely on screen readers.
**Action:** Always pair `truncate` classes with a native `title` attribute containing the full text on the element or its parent link/button to ensure hover discoverability.
## 2024-05-30 - Tooltips for icon-only buttons
**Learning:** Native `title` attributes on disabled `<button>` elements do not trigger browser tooltips. The title must be placed on an active element or wrapper to be visible. However, adding `title` to the active state of an icon-only button is a quick and effective micro-UX win that complements `aria-label`.
**Action:** Always pair `aria-label` with `title` on icon-only interactive elements to provide context for sighted users relying on hover, but use custom wrappers if explaining disabled states is strictly required.
