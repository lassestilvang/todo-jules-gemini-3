## 2026-05-04 - Decorative Icons Need ARIA Hidden
**Learning:** In this project's component architecture, Lucide icons placed next to descriptive text (like 'Add Label' or 'Delete') cause redundant screen reader announcements.
**Action:** Always add aria-hidden='true' to decorative Lucide icons when they are accompanied by visible descriptive text. Ensure icons conveying state (e.g., selection checkmarks) are not hidden without an accessible alternative.
## 2024-05-24 - Hide Decorative Icons from Screen Readers
**Learning:** Added `aria-hidden="true"` to `lucide-react` icons (like Plus, Trash2, Check) used alongside descriptive text or within buttons containing `aria-label`s.
**Action:** When adding decorative icons to buttons or interactive elements, explicitly hide them using `aria-hidden="true"` to prevent screen readers from redundantly announcing the icon names.
