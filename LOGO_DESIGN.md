# Wahgola Logo Design

## Brand Identity

**Wahgola** is a fun, modern travel planning app with a playful yet professional aesthetic.

## Logo Components

### 1. **Icon Design**
The logo features a stylized globe with travel routes and location pins:
- A circular globe outline (representing global travel)
- Curved paths crossing the globe (representing journey routes)
- Three location pins (representing destinations)

**Color Scheme:**
- Primary: `#2563eb` (Blue - trust, adventure)
- Accent: `#f59e0b` (Amber/Gold - warmth, excitement)
- Gradient: Linear gradient from blue to amber

### 2. **Typography**
**Font-based Logo: "Wahgola"**
- Base font: Bold, modern sans-serif
- The "go" is highlighted as an accent:
  - Heavier weight (800)
  - Primary blue color
  - Subtle gradient underline
- Letter spacing: -0.03em (tight, modern)

## Usage Examples

### Navigation Header
```html
<div class="logo-area">
    <svg class="logo-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <!-- Globe with route path -->
        <circle cx="16" cy="16" r="13" stroke="currentColor" stroke-width="2" opacity="0.3"/>
        <path d="M16 3 C10 3 10 10 16 16 C22 10 22 3 16 3" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M3 16 C3 10 10 10 16 16 C10 22 3 22 3 16" stroke="currentColor" stroke-width="2" fill="none"/>
        <!-- Location pins -->
        <circle cx="11" cy="11" r="2" fill="currentColor"/>
        <circle cx="21" cy="11" r="2" fill="currentColor"/>
        <circle cx="16" cy="21" r="2" fill="currentColor"/>
    </svg>
    <span class="logo-text">Wah<span class="logo-accent">go</span>la</span>
</div>
```

### Login/Landing Page
Features a larger, animated version with:
- Gradient background (blue to amber)
- Shimmer animation effect
- White icon on gradient background
- Gradient text treatment for brand name

## Interactive Elements

**Hover Effects:**
- Logo icon rotates slightly (-10deg) and scales (1.05x)
- Smooth transition (200ms cubic-bezier)

**Animations:**
- Floating animation on splash screen (2s ease-in-out loop)
- Shimmer effect on login logo (3s ease-in-out loop)

## Design Rationale

The logo emphasizes:
1. **Travel & Adventure**: Globe and routes represent exploration
2. **Multiple Destinations**: Three pins suggest trip planning
3. **Forward Motion**: The "go" accent highlights action and movement
4. **Modern & Fun**: Gradient colors and playful styling create an inviting feel
5. **Professional Quality**: Clean lines and balanced composition ensure credibility

## Color Psychology
- **Blue (#2563eb)**: Trust, reliability, professionalism
- **Amber (#f59e0b)**: Energy, warmth, adventure, optimism
- **Gradient**: Blends stability with excitement - perfect for travel planning
