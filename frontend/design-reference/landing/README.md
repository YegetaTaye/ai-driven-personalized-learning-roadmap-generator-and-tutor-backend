# Yeneta — Landing Page (React / TypeScript)

A faithful React port of the Yeneta landing page. Editorial bone + coral
aesthetic, Cormorant Garamond / Crimson Pro typography, with an interactive
DAG hero (curved SVG edges + hover tooltips).

## Files

```
src/landing/
├── LandingPage.tsx            # page composition — nav, hero, sections, footer
├── LandingPage.css            # all styles (design tokens + component CSS)
└── components/
    ├── DagPreview.tsx         # interactive hero graph (refs + useEffect)
    ├── LegendStrip.tsx        # the five mastery states
    └── PersonaArt.tsx         # learner / instructor / admin illustrations
```

## Usage

```tsx
import LandingPage from "./landing/LandingPage";

export default function App() {
  return <LandingPage />;
}
```

Or as a route:

```tsx
{ path: '/', element: <LandingPage /> }
```

## Fonts

Add this to your `index.html` `<head>` (the CSS references these families):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

## Notes

- **No dependencies** beyond React 18. No Tailwind, no UI kit.
- The DAG edges are drawn imperatively into an SVG inside a `useEffect`,
  recomputed on resize and after `document.fonts.ready` (node sizes shift
  once the serif loads). Everything else is declarative JSX.
- The instructor heatmap uses `useMemo` so its random cells stay stable
  across re-renders.
- `data-screen-label` attributes are kept for design-review tooling; safe
  to remove.
- CSS uses modern `oklch()` and `color-mix()` — supported in all current
  evergreen browsers. If you must support older targets, pre-compute these
  to hex/rgb.
