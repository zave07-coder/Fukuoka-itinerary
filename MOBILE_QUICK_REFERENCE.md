# Mobile UI/UX Quick Reference Guide

## 🎯 Quick Start

### What Changed?
1. **New file**: `mobile.css` - Load after other stylesheets
2. **Updated**: `index.html` - Added mobile nav + accessibility
3. **Updated**: `script.js` - Mobile nav behavior + keyboard support

### How to Test?
```bash
# Open in browser and use DevTools
1. Press F12 → Toggle device toolbar (Ctrl+Shift+M)
2. Test on: iPhone SE, iPhone 12 Pro, iPad, Galaxy S20
3. Check: Navigation, tap targets, scrolling, accessibility
```

---

## 📱 Key Responsive Breakpoints

```css
/* Small Mobile */
@media (max-width: 640px) { /* Single column, compact */ }

/* Mobile */
@media (max-width: 768px) { /* Bottom nav appears */ }

/* Tablet */
@media (max-width: 1024px) { /* Vertical map/itinerary stack */ }

/* Desktop */
@media (min-width: 1025px) { /* Side-by-side split view */ }
```

---

## 🎨 Design Tokens (CSS Variables)

```css
/* Tap Targets */
--tap-target-min: 44px;           /* Minimum for accessibility */
--tap-target-comfortable: 48px;   /* Comfortable tapping */

/* Spacing Scale */
--spacing-xs: 0.5rem;   /* 8px */
--spacing-sm: 0.75rem;  /* 12px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
--spacing-xxl: 3rem;    /* 48px */

/* Typography */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px - Mobile minimum */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
```

---

## 🔧 Common Patterns

### Making an Element Touch-Friendly
```css
.your-button {
    min-width: var(--tap-target-min);
    min-height: var(--tap-target-min);
    padding: var(--spacing-sm) var(--spacing-md);
    touch-action: manipulation; /* Prevents zoom */
}

.your-button:active {
    opacity: 0.7;
    transform: scale(0.95);
}
```

### Making Text Readable on Mobile
```css
.your-text {
    font-size: var(--font-size-base); /* 16px minimum */
    line-height: 1.5;                 /* Comfortable reading */
    max-width: 65ch;                  /* Optimal line length */
}
```

### Hiding Elements on Mobile Only
```css
@media (max-width: 768px) {
    .desktop-only {
        display: none;
    }
}
```

### Adding Mobile-Specific Content
```html
<!-- Show only on mobile -->
<div class="mobile-bottom-nav">
    <!-- Your mobile-only nav -->
</div>
```

```css
.mobile-bottom-nav {
    display: none;
}

@media (max-width: 768px) {
    .mobile-bottom-nav {
        display: flex;
    }
}
```

---

## ♿ Accessibility Checklist

### For New Buttons
```html
<button
    class="your-btn"
    aria-label="Descriptive action name"
    type="button">
    <span aria-hidden="true">🔥</span> <!-- Hide decorative icons -->
    <span>Button Text</span>
</button>
```

### For New Links
```html
<a
    href="#section"
    class="your-link"
    aria-label="Navigate to section name">
    Go to Section
</a>
```

### For Toggle Buttons
```html
<button
    id="myToggle"
    aria-expanded="false"
    aria-controls="myPanel">
    Toggle Panel
</button>
```

```javascript
toggleBtn.addEventListener('click', () => {
    const isExpanded = panel.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isExpanded);
});
```

### For Form Controls
```html
<label for="mySelect" class="sr-only">Choose an option</label>
<select id="mySelect" aria-label="Option selector">
    <option>Option 1</option>
</select>
```

### For Interactive Elements (Keyboard Support)
```javascript
element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        element.click();
    }
});
```

---

## 📐 Layout Patterns

### Full-Width on Mobile, Contained on Desktop
```css
.container {
    width: 100%;
    padding: 0 var(--spacing-md);
}

@media (min-width: 1024px) {
    .container {
        max-width: 1200px;
        margin: 0 auto;
    }
}
```

### Vertical Stack on Mobile, Horizontal on Desktop
```css
.layout {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

@media (min-width: 768px) {
    .layout {
        flex-direction: row;
    }
}
```

### Hidden on Mobile, Visible on Desktop
```css
.sidebar {
    display: none;
}

@media (min-width: 1024px) {
    .sidebar {
        display: block;
    }
}
```

---

## 🎭 Common Mobile Interactions

### Hamburger Menu Toggle
```javascript
const toggle = document.getElementById('navToggle');
const menu = document.getElementById('navMenu');

toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('active');
    toggle.setAttribute('aria-expanded', isOpen);
});

// Close on ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('active')) {
        menu.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
    }
});
```

### Smooth Scroll with Offset (for fixed header)
```javascript
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        const headerHeight = 60; // Adjust based on your header

        window.scrollTo({
            top: target.offsetTop - headerHeight,
            behavior: 'smooth'
        });
    });
});
```

### Detect Active Section (for Bottom Nav)
```javascript
function updateActiveState() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.mobile-nav-item');

    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.id;

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveState, { passive: true });
```

---

## 🐛 Common Issues & Fixes

### Issue: Elements too small on mobile
**Fix**: Add minimum tap target sizes
```css
.element {
    min-width: 44px;
    min-height: 44px;
    padding: 12px 16px;
}
```

### Issue: Text too small to read
**Fix**: Use at least 16px base font size
```css
.text {
    font-size: 1rem; /* 16px */
}
```

### Issue: Horizontal scroll on mobile
**Fix**: Ensure no fixed-width elements exceed viewport
```css
* {
    max-width: 100%;
}

.container {
    width: 100%;
    overflow-x: hidden;
}
```

### Issue: Fixed elements blocking content
**Fix**: Add padding to body or content
```css
body {
    padding-bottom: 70px; /* Height of bottom nav */
}
```

### Issue: Touch delay (300ms lag)
**Fix**: Use touch-action CSS property
```css
button, a, [onclick] {
    touch-action: manipulation;
}
```

### Issue: Focus not visible
**Fix**: Add clear focus styles
```css
*:focus-visible {
    outline: 3px solid #667eea;
    outline-offset: 2px;
}
```

---

## 📊 Testing Checklist

### Visual Testing
- [ ] All text is readable without zooming
- [ ] Buttons are easy to tap (44px+)
- [ ] No horizontal scrolling
- [ ] Spacing looks balanced
- [ ] Images scale properly

### Interaction Testing
- [ ] Navigation opens/closes smoothly
- [ ] Links respond immediately (no 300ms delay)
- [ ] Scrolling is smooth
- [ ] Forms are easy to fill out
- [ ] Dropdowns are easy to use

### Accessibility Testing
- [ ] Keyboard navigation works (Tab, Enter, Space, Esc)
- [ ] Focus indicators are visible
- [ ] Screen reader announces elements correctly
- [ ] Color contrast passes WCAG AA
- [ ] All images have alt text

### Performance Testing
- [ ] Page loads quickly on 3G
- [ ] Smooth scrolling (60fps)
- [ ] No layout shifts during load
- [ ] Touch events respond instantly

---

## 🚀 Quick Deploy Checklist

Before deploying mobile changes:

1. **Test on Real Devices**
   - [ ] iPhone (Safari)
   - [ ] Android (Chrome)
   - [ ] iPad (Safari)

2. **Browser Testing**
   - [ ] Chrome Mobile
   - [ ] Safari iOS
   - [ ] Firefox Mobile
   - [ ] Samsung Internet

3. **Orientation Testing**
   - [ ] Portrait mode
   - [ ] Landscape mode
   - [ ] Rotation transitions

4. **Accessibility Audit**
   - [ ] Run Lighthouse accessibility test (score 90+)
   - [ ] Test with VoiceOver (iOS)
   - [ ] Test with TalkBack (Android)
   - [ ] Test keyboard-only navigation

5. **Performance Check**
   - [ ] Lighthouse mobile score (85+)
   - [ ] Test on slow 3G network
   - [ ] Check for memory leaks

---

## 📝 Pro Tips

1. **Always test on real devices** - Simulators don't capture touch nuances
2. **Start with mobile first** - Easier to enhance than to strip down
3. **Use CSS variables** - Makes maintenance easier
4. **Keep tap targets 44px+** - Accessibility requirement
5. **Test with one hand** - Most mobile users use one hand
6. **Check in landscape** - Often forgotten but important
7. **Test with large text** - iOS/Android allow text scaling
8. **Use relative units** - rem/em scale better than px
9. **Optimize images** - Mobile networks can be slow
10. **Profile performance** - Check frame rate during scrolling

---

## 🆘 Need Help?

### Quick References
- **CSS Variables**: See `mobile.css` lines 1-50
- **Breakpoints**: See `mobile.css` throughout
- **Touch Patterns**: See `mobile.css` lines 750-800
- **Accessibility**: See `mobile.css` lines 850-950

### Documentation
- Full details: `MOBILE_REDESIGN_SUMMARY.md`
- This guide: `MOBILE_QUICK_REFERENCE.md`
- Project memory: `~/.claude/projects/.../memory/MEMORY.md`

### Common Files
- Styles: `mobile.css` (new), `styles.css`, `split-screen.css`
- HTML: `index.html`
- Scripts: `script.js`, `split-screen-sync.js`

---

**Last Updated**: 2026-03-28
**Version**: 1.0
**Status**: Production Ready ✅
