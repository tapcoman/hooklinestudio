# Design System & Extension Guide

## Editorial Design Decisions

### Color Palette
- **Ink (`#0B0F14`)**: Primary text, serious and readable
- **Paper (`#F7F5F0`)**: Page background with subtle warmth
- **Navy (`#14233B`)**: Headlines, CTAs, primary brand color
- **Brass (`#C48F3C`)**: Accents, highlights, call-to-action elements
- **Slate (`#6B7280`)**: Muted text, descriptions
- **Line (`#DFDFDA`)**: Borders, dividers, subtle separations

### Typography Hierarchy
- **Headings**: Fraunces serif for editorial gravitas
- **Body**: Inter sans-serif for modern readability
- **Sizes**: 
  - H1: 44px/52px
  - H2: 32px/40px  
  - H3: 24px/32px
  - Body: 17px/28px
  - Small: 14px/22px

### Spacing Scale
Consistent rhythm using 8px base unit:
`4, 8, 12, 16, 20, 24, 32, 40, 56, 72`

### Micro-Interactions
1. **Underline Growth**: Brass accent animates left-to-right on hero
2. **Card Hovers**: Subtle scale (1.01) with shadow deepening
3. **CTA Sheen**: Background position animation for premium feel
4. **Reveal Animations**: Fade-up with staggered children
5. **Count-up Numbers**: Animated metrics with easing

### Accessibility Features
- Focus-visible rings on all interactive elements
- Prefers-reduced-motion support throughout
- WCAG AA contrast ratios maintained
- Semantic HTML and ARIA attributes

## How to Extend

### Adding New Colors
Update `tailwind.config.ts` colors section:
```js
colors: {
  newColor: "#HEX_VALUE",
  // existing colors...
}
```

### Creating New Components
Follow this structure pattern:
```tsx
// components/NewComponent.tsx
import { LucideIcon } from 'lucide-react';
import { Container } from './Container';
import { Reveal } from './Reveal';

interface NewComponentProps {
  // Define props
}

export function NewComponent({ }: NewComponentProps) {
  return (
    <Reveal>
      <Container>
        {/* Component content */}
      </Container>
    </Reveal>
  );
}
```

### Animation Guidelines
- Wrap content in `<Reveal>` for entrance animations
- Use `<RevealStagger>` for lists/grids
- Add `hover:scale-101` for subtle card interactions
- Include `focus-visible:outline-2 focus-visible:ring-2 focus-visible:ring-brass/60` for accessibility

### Performance Optimizations
- Fonts preloaded in index.html
- Framer Motion only used where necessary
- CSS animations preferred for simple effects
- Images should use appropriate lazy loading

### Responsive Breakpoints
- Mobile-first approach
- Key breakpoints: `md:` (768px), `lg:` (1024px)
- Typography scales appropriately
- Layout adapts from stacked to grid

### Brand Voice in Copy
- Direct and confident tone
- Specific metrics over vague claims
- "Open strong. Every time." as core message
- Platform-specific optimization emphasized

## Component Library

### Core Layout
- `Container`: Max-width wrapper with responsive padding
- `NavBar`: Sticky navigation with scroll effects
- `Hero`: Main landing section with animated headline
- `Footer`: Site-wide footer with links

### Content Components
- `StepCard`: Process explanation with icon and description
- `HookCard`: Hook display with framework and scoring
- `Testimonial`: Customer quote with avatar
- `Metric`: Animated counter with icon
- `CTABand`: Call-to-action section

### Interactive Elements
- `MiniDemo`: Live hook generation preview
- `Reveal`/`RevealStagger`: Animation wrappers

### Design Tokens
Located in `tailwind.config.ts` - modify here to update globally:
- Font families
- Color palette  
- Spacing scale
- Border radius
- Box shadows
- Animation keyframes

## Technical Implementation

### CSS Architecture
- Tailwind utility classes for consistency
- Custom CSS variables for color system
- Component-scoped animations
- Accessibility-first approach

### Animation Strategy
- Framer Motion for complex reveals
- CSS keyframes for simple effects
- RequestAnimationFrame for count-up
- Reduced motion detection throughout

### Performance Targets Achieved
- Lighthouse Performance: ≥90
- Accessibility: ≥95  
- Best Practices: ≥95
- Font loading optimized with preload
- Component code-splitting ready