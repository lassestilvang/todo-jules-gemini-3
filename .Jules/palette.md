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
## 2024-05-18 - Inline Empty States
**Learning:** Plain text empty states in inline lists (like subtasks, attachments, or logs) look unpolished and do not guide the user effectively.
**Action:** Always replace simple italicized "No items" text with styled containers (e.g., `bg-muted/30 border-dashed`), a relevant icon, and helpful sub-text to improve visual polish and user guidance.
## 2025-05-22 - Async Upload Feedback and File Focus
**Learning:** For asynchronous file uploads (like attachments), missing immediate visual success/error feedback (toast notifications) leaves users unsure if the action succeeded. Furthermore, custom `<a>` tags representing files often lack keyboard focus indicators (`focus-visible`), hindering accessibility.
**Action:** Always provide explicit success and error toast notifications for async file operations, ensure custom links include focus ring classes (`focus-visible:ring-2`), and hide decorative icons from screen readers using `aria-hidden="true"`.
## 2026-04-30 - Error Handling Fallbacks in Toasts
**Learning:** When refactoring error fallbacks to avoid TypeScript 'any' casts (like `(error as any)?.message`), avoid using `String(error)` as a generic fallback, as plain objects might evaluate to strings like `[object Object]`, resulting in unhelpful user-facing toast notifications.
Always use `error instanceof Error ? error.message : (typeof error === 'string' ? error : "Fallback user-friendly string")` for toast error messages to ensure strict typing while providing clear feedback.
## 2026-05-01 - Optimistic Subtask Updates
**Learning:** Implementing optimistic UI updates for inline list toggles (like subtasks) provides immediate visual feedback, significantly improving the perceived performance of the app.
**Action:** Use optimistic state updates with try/catch rollbacks for fast-paced interactive elements.
## 2024-05-25 - Provide Screen-Reader Fallbacks for Hidden Stateful Icons\n**Learning:** When hiding stateful icons (like `CheckCircle` or `Circle` indicating task completion) with `aria-hidden="true"`, screen readers lose critical context if a fallback isn't provided.\n**Action:** Always pair `aria-hidden="true"` on stateful icons with a visually hidden `<span className="sr-only">[State]</span>` sibling to explicitly announce the state (e.g., "Completed" or "Incomplete") to screen reader users.
## 2025-05-24 - Plain Text Empty States
**Learning:** Radix UI / cmdk <CommandEmpty> states and similar inline UI components often default to plain text (e.g., 'No results found.'), which provides a poor user experience and breaks visual consistency with other polished empty states in the application.
**Action:** Always replace plain text empty states with styled containers (e.g., `bg-muted/30 border-dashed`), including a relevant, accessible icon (`aria-hidden="true"`) and helpful secondary guidance text.
