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
