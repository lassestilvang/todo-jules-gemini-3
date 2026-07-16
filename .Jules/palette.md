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
## 2025-05-25 - CommandEmpty Polish and Screen Reader Context
**Learning:** CommandEmpty components often default to plain UI without borders/backgrounds, and dynamic command items (like labels) using purely visual icons to indicate selection state (like an Assigned checkmark) hide vital context from screen readers if a fallback isn't added.
**Action:** Always wrap `<CommandEmpty>` inner content with a styled empty state container (e.g., `bg-muted/30 border border-dashed rounded-md p-4 m-2`) and always pair assigned/checked icons with visually hidden `<span className="sr-only">Assigned</span>` elements.

## 2026-05-21 - Add `aria-current="page"` to active navigation links
**Learning:** When navigation links use purely visual styling (like a 'secondary' button variant) to indicate the active page, screen reader users miss this crucial context.
**Action:** Always add `aria-current="page"` to navigation elements (like `<Link>`) when they represent the current active route to ensure parity for assistive technologies.

## 2026-05-22 - Add Tooltips to Truncated Text
**Learning:** When using text truncation classes (like Tailwind's `truncate`) in constrained UI layouts like sidebars, users lose access to the full text, which degrades UX. Additionally, long text can inadvertently squish adjacent icons if `shrink-0` is not applied.
**Action:** Always add a native `title` attribute containing the full text to the element or its parent link when using text truncation, and ensure adjacent icons have the `shrink-0` class to prevent layout breakage.
## 2026-05-23 - Prevent SVG Squishing in Flex Layouts
**Learning:** In constrained flexbox layouts (like sidebars) using `truncate` for text, adjacent SVG icons without explicit `shrink-0` classes will compress when the text overflows, degrading the UI.
**Action:** Always add the `shrink-0` class to icons placed next to text that has the `truncate` class in flex containers.
## 2026-05-24 - Ensure Cancel Buttons Have type="button"
**Learning:** In form dialogs or modal confirmations, not explicitly setting `type="button"` on "Cancel" or alternative action buttons can accidentally trigger unwanted form submissions if the component is wrapped in a form later.
**Action:** Always ensure that "Cancel" and other non-submit action buttons explicitly have the `type="button"` attribute to provide a clear, non-destructive exit path and prevent unintended form submissions.
## 2026-05-24 - Disabled Button Tooltips
**Learning:** Native `title` attributes do not trigger on disabled `<button>` elements across most browsers. Attempting to add a tooltip explaining *why* a button is disabled directly to the button will fail, leaving users confused.
**Action:** Always wrap disabled buttons in a container element (like a `<span>` with `tabIndex={-1}`) and apply the `title` attribute to the wrapper to ensure the explanatory tooltip is accessible to sighted users via mouse hover.
## 2026-05-24 - Quick-save for Textareas and Explicit Button Types
**Learning:** In textareas intended for descriptions or notes, users expect standard keyboard shortcuts like Cmd+Enter or Ctrl+Enter to save their input quickly. Without it, they are forced to use the mouse to click outside the textarea to trigger `onBlur`, breaking their keyboard flow. Additionally, cancel/close buttons inside dialogs or forms can inadvertently act as submit buttons if they are missing `type="button"`.
## 2025-06-07 - Add Consistent Hover Transitions to Sidebar Links
**Learning:** Ghost buttons used as navigation links in sidebars often miss the subtle hover background colors (`hover:bg-muted/50`) and smooth transitions (`transition-colors`) that are present on adjacent secondary actions (like "Create" buttons), breaking visual consistency.
**Action:** Always ensure navigation links and list items using ghost variants explicitly include `transition-colors hover:bg-muted/50` if they do not inherit them by default from the design system's variant.
## 2025-06-08 - Required Form Field Indicators
**Learning:** Dialogs with form fields that disable their submit button when empty provide no upfront indication to sighted users that the fields are mandatory. Relying solely on a disabled submit button leads to a guessing game.
**Action:** Always add a visual required indicator (e.g., `<span className="text-destructive">*</span>`) to the labels of mandatory fields, and include the HTML5 `required` attribute on the inputs to provide clear upfront expectations and better semantic validation.
## 2026-06-25 - Required Form Field Indicators
**Learning:** In forms or dialogs where the submit button is disabled until mandatory fields are filled, users (especially those relying on screen readers or with cognitive disabilities) may not understand why they cannot submit.
**Action:** Always provide explicit upfront indications by adding a visual required indicator (e.g., `*` in a destructive color) to the label and including the HTML5 `required` attribute on the input element to improve usability and accessibility.
## 2026-06-25 - Dynamic aria-label Anti-pattern
**Learning:** When providing contextual validation feedback for disabled buttons, never dynamically change the button's `aria-label` to an error message, as it removes the button's semantic function for screen readers.
**Action:** Always keep the `aria-label` focused on the primary action and use a wrapping `<span title="...">` to display the error message as a visual tooltip for sighted users.
