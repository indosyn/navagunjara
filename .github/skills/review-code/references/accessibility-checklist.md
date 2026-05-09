# Accessibility Review Checklist

Target: WCAG 2.1 AA.

## Semantics & Structure
- [ ] Landmarks present (`header`, `nav`, `main`, `aside`, `footer`)
- [ ] Heading order is sequential (no skipped levels)
- [ ] Lists used for list-like content (`<ul>`, `<ol>`)
- [ ] Interactive elements use correct tags (`<button>`, `<a>`, `<input>`)
- [ ] Page has a descriptive `<title>` and `lang` attribute

## Keyboard
- [ ] Every interactive element is reachable and operable via keyboard
- [ ] Visible focus ring on all focusable elements
- [ ] Logical tab order matches visual order
- [ ] Focus is managed on route changes and modal open/close
- [ ] No keyboard traps (focus can always move forward and back)

## Forms
- [ ] Every input has a programmatically associated `<label>`
- [ ] Required fields indicated in text, not color alone
- [ ] Error messages linked via `aria-describedby` and announced
- [ ] Grouped fields use `<fieldset>` + `<legend>`
- [ ] `autocomplete` attributes set for common fields

## Images & Media
- [ ] Informative images have descriptive `alt` text
- [ ] Decorative images have `alt=""` or are CSS backgrounds
- [ ] Icon-only buttons have `aria-label` or visually hidden text
- [ ] Video/audio has captions and transcripts where applicable

## ARIA
- [ ] Prefer semantic HTML over ARIA when possible
- [ ] ARIA roles, states, and properties are valid and match the element
- [ ] `aria-live` regions used for dynamic content announcements
- [ ] `aria-expanded`, `aria-selected`, `aria-current` reflect state

## Color & Contrast
- [ ] Body text contrast ≥ 4.5:1
- [ ] Large text (≥ 18pt or 14pt bold) contrast ≥ 3:1
- [ ] UI components and focus indicators contrast ≥ 3:1
- [ ] Information is not conveyed by color alone

## Motion & Timing
- [ ] Respects `prefers-reduced-motion`
- [ ] Auto-playing / moving content can be paused
- [ ] No content flashes more than 3 times per second
- [ ] Timeouts can be extended or disabled

## Responsive & Zoom
- [ ] Content usable at 200% zoom without loss of content or function
- [ ] Layout reflows at 320px width without horizontal scroll
- [ ] Target size for touch ≥ 24×24 CSS pixels (ideally 44×44)
