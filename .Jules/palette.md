## 2025-04-11 - Standalone Checkboxes Accessibility
**Learning:** In this application, standalone Radix UI Checkbox components within task items and subtask lists frequently lack accessible names (no `aria-label` or `<Label>`), making them difficult for screen readers to interpret.
**Action:** Always ensure standalone Checkbox components that aren't wrapped in a `<label>` or paired with an explicit `<Label>` component have a descriptive `aria-label` associated with the item they control.
