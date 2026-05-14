## 2026-05-04 - Decorative Icons Need ARIA Hidden
**Learning:** In this project's component architecture, Lucide icons placed next to descriptive text (like 'Add Label' or 'Delete') cause redundant screen reader announcements.
**Action:** Always add aria-hidden='true' to decorative Lucide icons when they are accompanied by visible descriptive text. Ensure icons conveying state (e.g., selection checkmarks) are not hidden without an accessible alternative.
## 2024-05-24 - Hide Decorative Icons from Screen Readers
**Learning:** Added `aria-hidden="true"` to `lucide-react` icons (like Plus, Trash2, Check) used alongside descriptive text or within buttons containing `aria-label`s.
**Action:** When adding decorative icons to buttons or interactive elements, explicitly hide them using `aria-hidden="true"` to prevent screen readers from redundantly announcing the icon names.

## 2024-05-05 - Inconsistent Dialog Accessibility & Keyboard UX
**Learning:** Found inconsistent implementation in `Dialog` components (`CreateListDialog` vs `CreateLabelDialog`). The `CreateListDialog` lacked a `<DialogDescription>`, which is required for screen readers when a `<DialogTitle>` is present. Additionally, it lacked `autoFocus` on the input, forcing an extra click for keyboard users.
**Action:** Always ensure `<DialogContent>` includes a `<DialogDescription>` for context, and apply `autoFocus` to the primary input field in modals to optimize keyboard usability and screen reader accessibility.
## 2024-05-24 - Add missing SheetDescription to TaskDetailSheet
**Learning:** Radix UI Dialog and Sheet components require a visually hidden or visible Description element when a Title is present to satisfy screen reader accessibility requirements and prevent console warnings. Adding `<SheetDescription className="sr-only">...</SheetDescription>` effectively resolves this without altering the visual design.
**Action:** Always ensure that any `<Sheet>` or `<Dialog>` component includes both a Title and a Description.
## 2026-05-07 - Improved Empty State for Search Command
**Learning:** Found that the default `shadcn/ui` Command component defaults to simple text for its empty state ("No results found."). In a global search bar, the UI is empty as soon as it's opened (before any query is entered), making "No results found" inaccurate and jarring.
**Action:** When working with search command dialogs, always create a styled `<CommandEmpty>` layout that uses a descriptive icon with `aria-hidden="true"` and conditionally renders its text to differentiate between "no query entered" and "no matching results".
## 2026-05-12 - Replacing window.confirm with accessible custom Dialogs
**Learning:** Destructive actions using native window.confirm block the UI thread and lack accessible focus management, causing jarring UX. Radix UI Dialogs provide a polished, keyboard-accessible alternative but require correctly configured open/onOpenChange state lifting.
**Action:** Always replace window.confirm dialogs with custom accessible <Dialog> components and pass autoFocus to the primary destructive action (e.g. Delete) to optimize keyboard usability.

## 2026-05-10 - Avoid window.confirm for Destructive Actions
**Learning:** Native `window.confirm()` dialogs pause script execution, look jarring, and lack accessible focus management compared to native React components. They are also difficult to style consistently with the rest of the application.
**Action:** For destructive actions like deletions, always use the project's existing design system (e.g. `@/components/ui/dialog`) to create custom confirmation modals. This ensures visual consistency, better accessibility via native Radix focus management, and a smoother user experience without blocking the thread.
## 2026-05-14 - Improve empty states inside Command components
**Learning:** Command components nested inside Popovers/Selects (like the labels dropdown) need a consistent empty state. Plain text empty states in a search context look unfinished compared to the rest of the application.
**Action:** When adding empty states to `<CommandEmpty>` components, replace the default plain text with a styled container (e.g., flex-col, centered) containing a relevant icon with `aria-hidden='true'` and descriptive sub-text to ensure a polished visual experience.
