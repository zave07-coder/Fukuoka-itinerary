# Wahgola Changelog

All notable changes to this project will be documented in this file.

**Format:** Based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
**Versioning:** Semantic Versioning (Phase-based for MVP)

---

## [Unreleased]

### Phase 1A - In Progress
- Multi-trip dashboard (planned)
- localStorage trip manager (planned)
- New trip modal (planned)

---

## [Phase 0] - 2026-03-29

### Added - Core Features
- **Single-trip itinerary viewer** with accordion layout
  - Day-by-day activities with timing and GPS locations
  - Collapsible sections for each day
  - Inline activity details (flights, hotels, restaurants, activities)

- **Granular AI editing** (killer feature)
  - Edit individual days OR entire trip
  - Context-aware AI suggestions via GPT-4o-mini
  - Chat interface for natural language requests

- **Visual preview before applying changes**
  - Modal shows all AI suggestions before committing
  - Checkbox selection for each suggested edit
  - Displays AI reasoning for each change
  - GPS coordinates included in location edits

- **Split-screen map + itinerary**
  - Mapbox GL JS integration
  - Real-time bidirectional sync (map ↔ itinerary)
  - Click day → Map highlights all locations
  - Click map marker → Scrolls to activity in itinerary
  - GPS markers for all activities

- **Version control system**
  - Full undo/redo functionality
  - Change history sidebar with timestamps
  - Track all edits (AI + manual)
  - Restore previous versions

- **Mobile-responsive design**
  - 2048-line mobile.css (comprehensive mobile optimization)
  - 44px+ touch targets (WCAG AAA compliant)
  - Horizontal overflow prevention
  - Optimized for mobile browsing (70% of users)

- **Compact UI update**
  - 15-20% reduction in vertical whitespace
  - Tighter typography scale
  - Improved visual hierarchy
  - Better information density

### Technical Implementation
- **Frontend:** Vanilla JavaScript (zero build step)
- **Styling:** Modular CSS (5 files: styles, split-screen, mobile, version-control, inline-edit)
- **Hosting:** Cloudflare Pages (Advanced Mode)
- **Database:** Neon PostgreSQL (configured but unused in Phase 0)
- **AI:** OpenAI GPT-4o-mini (via _worker.js proxy)
- **Maps:** Mapbox GL JS v3.0.1

### Architecture Decisions
- **Vanilla JS vs React:** Chose vanilla for zero build step, faster iteration
- **localStorage-first:** No persistence in Phase 0 (data resets on refresh)
- **Worker proxy:** Avoids exposing API keys in client-side code
- **Split-screen layout:** Desktop shows map + itinerary side-by-side

### Deployment
- **URL:** https://fkk.zavecoder.com/
- **Platform:** Cloudflare Pages
- **Auto-deploy:** On git push to main branch
- **Edge function:** _worker.js for AI API proxy

### Metrics (Phase 0)
- **Users:** ~50 (personal use + demo sharing)
- **Load time:** <2s desktop, <4s mobile
- **Mobile usability:** WCAG AAA compliant
- **Uptime:** 99.9% (Cloudflare Pages SLA)

### Lessons Learned
- **What worked:**
  - Granular AI editing is highly valuable (users love per-day control)
  - Visual preview builds trust (users feel in control)
  - Split-screen map sync is unique differentiator
  - Mobile-first CSS pays off (most users browse on mobile)

- **What didn't work:**
  - No persistence = data loss on refresh (biggest complaint)
  - Single-trip limit = can't compare multiple options
  - No auth = can't access from multiple devices

- **User feedback:**
  - ✅ "Love the AI preview - no surprises!"
  - ✅ "Map sync is magical - saves so much time"
  - ✅ "Mobile experience is smooth"
  - ⚠️ "Lost my trip when I refreshed - need save feature"
  - ⚠️ "Can't create multiple trips to compare"

### Known Issues
- [ ] No data persistence (localStorage not implemented yet)
- [ ] Single trip only (no multi-trip support)
- [ ] No authentication (can't sync across devices)
- [ ] Hardcoded trip data (no dynamic creation)

### Next Phase (1A)
See [ROADMAP.md](./ROADMAP.md) Phase 1A for planned features.

---

## Template for Future Entries

```markdown
## [Phase X] - YYYY-MM-DD

### Added
- Feature name
  - Subfeature details
  - User benefit

### Changed
- What was modified from previous behavior
- Why it was changed

### Fixed
- Bug description
- How it was fixed

### Technical Decisions
- **Decision:** Rationale
- **Alternative considered:** Why rejected

### Lessons Learned
- What worked well
- What didn't work
- What to do differently next time

### Metrics
- Key performance indicators
- User feedback summary

### Known Issues
- Outstanding bugs or limitations
```

---

**Last Updated:** 2026-03-29
