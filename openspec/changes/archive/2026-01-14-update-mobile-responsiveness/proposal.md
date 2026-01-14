# Change: Update Mobile Responsiveness

## Why
The current user interface is designed for general readability and accessibility but lacks specific optimizations for modern mobile devices (specifically iPhones). Users need a layout that adapts seamlessly to smaller screens, handling safe areas (notches/dynamic islands) and touch interactions properly to ensure a polished mobile experience.

## What Changes
- **Viewport Meta Tag**: Ensure `viewport-fit=cover` is present.
- **Safe Area Insets**: Add padding for iOS safe areas (top/bottom) to prevent content overlap with notches or home indicators.
- **Mobile-First Layout**: Refine CSS media queries to ensure elements stack and scale correctly on narrow screens (e.g., iPhone SE to Pro Max).
- **Touch Optimization**: Ensure all tap targets are easily accessible without zooming, and remove potential 300ms tap delays if present.
- **Bottom Navigation**: Ensure the fixed bottom navigation bar respects the home indicator area.

## Impact
- **Affected specs**: `user-interface`
- **Affected code**: 
  - `frontend/index.html` (meta tags)
  - `frontend/src/style.css` (global styles, variables)
  - `frontend/src/App.vue` (layout container, bottom nav)
  - `frontend/src/views/*.vue` (responsive adjustments)
