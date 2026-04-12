## 2025-04-11 - Standalone Checkboxes Accessibility
**Learning:** In this application, standalone Radix UI Checkbox components within task items and subtask lists frequently lack accessible names (no `aria-label` or `<Label>`), making them difficult for screen readers to interpret.
**Action:** Always ensure standalone Checkbox components that aren't wrapped in a `<label>` or paired with an explicit `<Label>` component have a descriptive `aria-label` associated with the item they control.
## 2024-05-15 - Replace div with button for search trigger
**Learning:** Interactive "fake inputs" used as global search triggers (cmd+k) are often built with `div` elements, breaking keyboard navigation. These must use native `<button>` elements to automatically enter the tab order and support keyboard activation, avoiding a major accessibility barrier.
**Action:** Always verify that elements triggering modals or sidebars use a semantic `<button>` tag, or have proper `role="button"` and `tabIndex=0` with `keydown` handling.
