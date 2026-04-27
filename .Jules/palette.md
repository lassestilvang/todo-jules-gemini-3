## 2025-04-11 - Standalone Checkboxes Accessibility
**Learning:** In this application, standalone Radix UI Checkbox components within task items and subtask lists frequently lack accessible names (no `aria-label` or `<Label>`), making them difficult for screen readers to interpret.
**Action:** Always ensure standalone Checkbox components that aren't wrapped in a `<label>` or paired with an explicit `<Label>` component have a descriptive `aria-label` associated with the item they control.
## 2024-05-15 - Replace div with button for search trigger
**Learning:** Interactive "fake inputs" used as global search triggers (cmd+k) are often built with `div` elements, breaking keyboard navigation. These must use native `<button>` elements to automatically enter the tab order and support keyboard activation, avoiding a major accessibility barrier.
**Action:** Always verify that elements triggering modals or sidebars use a semantic `<button>` tag, or have proper `role="button"` and `tabIndex=0` with `keydown` handling.
## 2024-04-14 - Add Keyboard Navigation to Custom List Items
**Learning:** Custom components (like `div`s acting as list items) that handle `onClick` events require explicit `role="button"`, `tabIndex={0}`, `onKeyDown` handlers (for Enter/Space), and visible focus states (`focus-visible:ring-2`) to be accessible to keyboard users. Child interactive elements (like Checkboxes) must stop keydown event propagation to prevent triggering the parent's action.
**Action:** Always add keyboard event handlers and focus styles when making non-interactive elements clickable.

## 2024-04-15 - Add loading states to creation dialogs
**Learning:** For asynchronous dialog submissions (like creating labels or lists), users may double-click the submit button if there is no immediate visual feedback or disabled state, leading to duplicate database records and a confusing UX.
**Action:** Always implement an `isSubmitting` state in dialog forms to disable inputs and the submit button, and include a visual indicator (like a loading spinner) during the async operation to prevent duplicate submissions and provide clear feedback.
## 2025-04-16 - Add confirmation dialogs to destructive actions
**Learning:** Destructive actions like deleting a task should not happen immediately upon button click. Users need a chance to cancel the action to prevent accidental data loss. Using a native `window.confirm` dialog is a simple, accessible, and effective way to implement this safety net without requiring a complex custom modal.
**Action:** Always wrap destructive actions (like deletions) in a confirmation dialog (`if (window.confirm('...'))`) to prevent accidental data loss and improve user confidence.
## 2025-04-17 - Label linkage for Checkboxes and Empty States
**Learning:** Standalone checkboxes inside item lists (like subtasks) often use adjacent `span` elements for text, meaning users must precisely click the small checkbox to toggle the item. Also, empty lists without placeholders leave users wondering if content failed to load.
**Action:** Always link adjacent text to checkboxes using a `<label>` with `htmlFor` matching the checkbox's `id` to increase the clickable area. Additionally, always provide helpful empty states (e.g., "No items yet.") for empty list containers to improve clarity.
## 2025-05-20 - Add aria-labels to SelectTrigger components
**Learning:** Custom UI components like Radix UI `<SelectTrigger>` are not always natively linked to adjacent `<Label>` elements via standard `htmlFor`/`id` pairs by screen readers unless explicitly configured or if the component internally wires it up.
**Action:** Always ensure `<SelectTrigger>` and similar custom interactive components are correctly linked to their visual `<Label>` using `htmlFor` and `id`. Use an explicit `aria-label` only when a visual label is not present.
## 2024-04-24 - Task List Empty States
**Learning:** Empty states present an excellent opportunity to improve UX by providing clear visual cues (icons) and encouraging actions when no data is present, rather than showing a generic text block. This provides a more polished and inviting experience.
**Action:** Always consider empty states as a first-class citizen of the UI, and replace generic "No data" strings with specific, icon-accompanied guidance or congratulations when a user completes a list.
## 2025-05-21 - Add Enter key support for inline edit inputs
**Learning:** In this app, many text inputs (like task detail properties) use `onBlur` to automatically save changes to the database. However, users naturally expect to press the 'Enter' key to commit changes in a form field. Without explicitly handling 'Enter', keyboard users are forced to tab away or click outside the input, creating a confusing and inaccessible experience.
**Action:** Always add an onKeyDown handler ((e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.currentTarget.blur(); }) to inputs that save on blur to provide intuitive keyboard-driven submission.
## 2024-05-18 - Missing Screen-Reader Context for Visual Indicators
**Learning:** Visual indicators like red text for overdue dates provide important context to sighted users, but leave screen-reader users completely unaware of the status if not accompanied by hidden text.
**Action:** Always wrap visual status indicators with a conditionally rendered `<span className="sr-only">` element to provide parity for assistive technologies.
