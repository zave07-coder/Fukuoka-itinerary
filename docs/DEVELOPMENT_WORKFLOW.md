# Wahgola Development Workflow

**Purpose:** Ensure documentation stays in sync with code throughout development

---

## 🎯 Core Principle

**"Code without docs = incomplete work"**

Every feature, bug fix, or architectural change must update relevant documentation **before** being considered complete.

---

## 📋 Workflow Steps

### **Step 1: Before Starting Work**

1. **Read relevant docs:**
   - Starting Phase 1A? Read `ROADMAP.md` Phase 1A section
   - Building API endpoint? Read `TECHNICAL_ARCHITECTURE.md` API section
   - Changing data model? Read data models section

2. **Create a task checklist:**
   ```markdown
   ## Task: Build Multi-Trip Dashboard

   Reference: ROADMAP.md Phase 1A, Week 1

   Code:
   - [ ] dashboard.html
   - [ ] dashboard.css
   - [ ] trip-manager.js

   Docs to update:
   - [ ] ROADMAP.md (mark Phase 1A Week 1 complete)
   - [ ] TECHNICAL_ARCHITECTURE.md (if data model changes)
   - [ ] README.md (update "Current Status")
   ```

### **Step 2: During Development**

1. **Take notes on deviations:**
   - Planned to use X, but used Y instead? Note why.
   - Discovered edge case not in docs? Write it down.
   - Changed architecture? Document the decision.

2. **Example deviation log:**
   ```markdown
   ## Dev Notes - Dashboard Implementation

   **Deviation from plan:**
   - PLANNED: Store cover images as URLs
   - ACTUAL: Store as base64 (avoid external dependencies)
   - REASON: Offline-first, no network calls for images

   **New edge case:**
   - localStorage quota exceeded with 15+ trips
   - SOLUTION: Compress images, warn at 80% quota

   **Architecture change:**
   - Added trip-utils.js (not in original plan)
   - REASON: Shared functions between dashboard + trip viewer
   ```

### **Step 3: After Completing Feature**

**Before marking as "done", update ALL relevant docs:**

#### **A. ROADMAP.md Updates**

```markdown
<!-- Change this: -->
- [ ] Multi-trip dashboard

<!-- To this: -->
- [x] Multi-trip dashboard ✅ (Completed 2026-04-05)
  - Created dashboard.html, dashboard.css
  - Implemented localStorage CRUD in trip-manager.js
  - Added trip card grid (2-3 columns desktop, 1 mobile)
  - Edge case: localStorage quota warning at 80% capacity
  - Deviation: Stored images as base64 (not URLs) for offline-first
```

#### **B. TECHNICAL_ARCHITECTURE.md Updates**

If you changed data models, API, or architecture:

```markdown
<!-- Add new section or update existing -->

### localStorage Structure (Updated 2026-04-05)

**Changes from original:**
- Added `coverImageBase64` field (instead of `coverImageUrl`)
- Added `quotaUsed` tracking
- Added `compressedDays` flag (for quota management)

```javascript
{
  "trips": [
    {
      "id": "...",
      "coverImageBase64": "data:image/jpeg;base64,...", // NEW
      "compressedDays": false, // NEW
      // ... rest of fields
    }
  ],
  "quotaUsed": 0.65, // NEW: Track localStorage usage (0-1)
  "quotaWarningShown": false // NEW: Prevent multiple warnings
}
```

**Rationale:**
- Base64 storage enables offline-first (no network calls)
- Quota tracking prevents silent failures
- Compression flag allows future optimization
```

#### **C. README.md Updates**

Update "Current Status" section:

```markdown
### **What's Live (Phase 1A - Week 1 Complete):**
- ✅ Multi-trip dashboard (card grid layout)
- ✅ localStorage trip manager (CRUD operations)
- ✅ New trip modal (blank / AI options)
- ✅ Quota management (warns at 80% capacity)
- ✅ Base64 image storage (offline-first)

### **What's Next (Phase 1A - Week 2):**
- 🚧 Trip duplication
- 🚧 Trip search/filter
- 🚧 Auto-save indicator
```

#### **D. CHANGELOG.md (New File)**

Create `docs/CHANGELOG.md` to track all changes:

```markdown
# Changelog

## [Unreleased]

### Phase 1A - Week 1 (2026-04-05)

#### Added
- Multi-trip dashboard with card grid layout
- localStorage CRUD operations (trip-manager.js)
- New trip modal with blank/AI generation options
- localStorage quota tracking and warnings
- Base64 image storage for offline support

#### Changed
- Refactored trip data structure (added quotaUsed field)
- Cover images now stored as base64 (not URLs)

#### Technical Decisions
- **Base64 storage:** Enables offline-first, avoids CORS issues
- **Quota tracking:** Prevent silent localStorage failures
- **trip-utils.js:** Shared utilities between dashboard + trip viewer

#### Lessons Learned
- localStorage quota (5-10MB) fills quickly with images
- Compress images to 400px width = 5KB vs 50KB+ original
- Warning at 80% capacity gives user time to authenticate

---

## [Phase 0] - 2026-03-29

### Completed
- Single-trip itinerary viewer
- Granular AI editing (per day + full trip)
- Visual preview with selective checkboxes
- Split-screen map + itinerary sync
- Mobile-responsive design (2048-line mobile.css)
- Deployed to https://fkk.zavecoder.com/
```

### **Step 4: Weekly Review**

**Every Friday (15 min):**

1. **Check docs vs reality:**
   ```bash
   # Quick audit script
   echo "📋 Documentation Sync Check"
   echo ""
   echo "🔍 Features completed this week:"
   git log --since="1 week ago" --oneline | grep "feat:"
   echo ""
   echo "📝 Documentation commits this week:"
   git log --since="1 week ago" --oneline -- docs/
   echo ""
   echo "⚠️  If code commits >> doc commits, update docs now!"
   ```

2. **Update roadmap timeline:**
   - Mark completed features
   - Adjust estimates for remaining work
   - Note blockers or delays

3. **Update "Last Updated" dates:**
   - ROADMAP.md: Update weekly
   - TECHNICAL_ARCHITECTURE.md: Update if architecture changed
   - PRODUCT_VISION.md: Update quarterly or on pivots

---

## 🔧 Automation Helpers

### **Git Commit Template**

Create `.gitmessage` template to remind you about docs:

```bash
# .gitmessage
# <type>: <subject> (max 50 chars)
#
# <body> (wrap at 72 chars)
#
# Docs updated:
# - [ ] ROADMAP.md (if feature complete)
# - [ ] TECHNICAL_ARCHITECTURE.md (if architecture changed)
# - [ ] CHANGELOG.md (always)
# - [ ] README.md (if status changed)
#
# Type: feat, fix, docs, refactor, test, chore
```

Enable it:
```bash
git config commit.template .gitmessage
```

### **Pre-Commit Hook**

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Check if code files changed but no doc files updated
CODE_CHANGED=$(git diff --cached --name-only | grep -E '\.(js|html|css)$')
DOCS_CHANGED=$(git diff --cached --name-only | grep 'docs/')

if [ -n "$CODE_CHANGED" ] && [ -z "$DOCS_CHANGED" ]; then
  echo "⚠️  WARNING: Code changed but no documentation updated!"
  echo ""
  echo "Consider updating:"
  echo "  - docs/ROADMAP.md (mark features complete)"
  echo "  - docs/CHANGELOG.md (document changes)"
  echo "  - docs/README.md (update status)"
  echo ""
  echo "Continue anyway? (y/n)"
  read -r response
  if [ "$response" != "y" ]; then
    echo "Commit aborted. Update docs first."
    exit 1
  fi
fi
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

### **VS Code Snippets**

Create `.vscode/docs.code-snippets`:

```json
{
  "Update Roadmap": {
    "prefix": "docroad",
    "body": [
      "## Updated ROADMAP.md",
      "",
      "**Phase:** ${1:1A}",
      "**Feature:** ${2:Multi-trip dashboard}",
      "**Status:** ✅ Complete / 🚧 In Progress / ❌ Blocked",
      "",
      "### Changes:",
      "- ${3:Description of what was built}",
      "",
      "### Deviations:",
      "- ${4:What changed from original plan and why}",
      "",
      "### Lessons Learned:",
      "- ${5:What worked, what didn't, what to do differently}"
    ]
  },
  "Update Changelog": {
    "prefix": "doclog",
    "body": [
      "## [${1:Phase 1A}] - ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
      "",
      "### Added",
      "- ${2:New feature description}",
      "",
      "### Changed",
      "- ${3:What was modified}",
      "",
      "### Technical Decisions",
      "- **${4:Decision}:** ${5:Rationale}",
      "",
      "### Lessons Learned",
      "- ${6:Key insight from implementation}"
    ]
  }
}
```

---

## 📊 Documentation Health Metrics

### **Weekly Check (Takes 2 min):**

```bash
# How outdated are docs?
echo "📅 Last doc update:"
git log -1 --format="%ai" -- docs/

echo ""
echo "📅 Last code update:"
git log -1 --format="%ai" -- "*.js" "*.html" "*.css"

echo ""
echo "⏳ Days since doc update:"
# Calculate difference
```

### **Quality Indicators:**

✅ **Healthy docs:**
- Docs updated within 3 days of code changes
- CHANGELOG.md has entry for every feature
- ROADMAP.md status matches reality
- No TODOs older than 1 week

⚠️ **Warning signs:**
- Docs >1 week stale
- Code commits without corresponding doc updates
- "Current Status" section doesn't match actual state

❌ **Unhealthy docs:**
- Docs >1 month stale
- Multiple features shipped but ROADMAP.md not updated
- Technical architecture doesn't match actual implementation

---

## 🎯 Phase-Specific Documentation Rules

### **Phase 1A (Multi-Trip MVP):**

**Must update after each feature:**
- `ROADMAP.md` Phase 1A section (mark checkboxes)
- `CHANGELOG.md` (document what changed)
- `README.md` (update "Current Status")

**Nice to have:**
- Code comments explaining complex logic
- JSDoc for public functions

### **Phase 1B (Auth + Sync):**

**Must update:**
- `TECHNICAL_ARCHITECTURE.md` (new API endpoints, data flow)
- `ROADMAP.md` Phase 1B section
- `CHANGELOG.md` (auth flow, sync logic)
- `README.md` (new features live)

**Critical:**
- Document auth flow with diagrams
- Document sync conflict resolution
- Document data migration strategy

### **Phase 2+ (Templates, Sharing):**

**Must update:**
- API documentation (new endpoints)
- Database schema (if changed)
- User-facing docs (how to use new features)

---

## 🚨 When to Sound the Alarm

### **Doc Debt Triggers:**

**Level 1 (Yellow):** Remind yourself
- Docs 3+ days stale
- 1 undocumented feature
- **Action:** Block 30 min to update docs

**Level 2 (Orange):** Stop coding
- Docs 1+ week stale
- 3+ undocumented features
- Technical architecture doesn't match code
- **Action:** Block 2 hours to catch up docs

**Level 3 (Red):** Emergency
- Docs 1+ month stale
- Can't onboard new developer with current docs
- Docs contradict actual implementation
- **Action:** Stop all new features, dedicate full day to docs

---

## 💡 Best Practices

### **1. Document Decisions, Not Just Facts**

❌ **Bad:**
```markdown
- Added trip-manager.js
```

✅ **Good:**
```markdown
- Added trip-manager.js
  - Decided to separate localStorage logic from UI
  - Rationale: Easier to test, reusable across dashboard + trip viewer
  - Alternative considered: Inline in dashboard.js (rejected for maintainability)
```

### **2. Link Code to Docs**

In code comments:
```javascript
/**
 * Sync localStorage trips to cloud database
 *
 * See TECHNICAL_ARCHITECTURE.md "Sync Logic" section
 * for conflict resolution strategy.
 *
 * @see docs/TECHNICAL_ARCHITECTURE.md#sync-logic
 */
function syncToCloud() {
  // Implementation...
}
```

### **3. Use Consistent Formatting**

**Dates:** Always YYYY-MM-DD (sortable, unambiguous)
**Status:** ✅ Complete, 🚧 In Progress, ❌ Blocked, 📋 Planned
**Versions:** Semantic versioning (1.0.0, 1.1.0, 2.0.0)

### **4. Keep Examples Real**

Use actual trip data from your app:
- ✅ "Fukuoka Family Adventure" (real)
- ✅ "Kyoto Cultural Tour" (realistic)
- ❌ "Sample Trip" (lazy)
- ❌ "Trip 1" (unhelpful)

---

## 📝 Quick Reference

### **Feature Complete Checklist:**

```markdown
Before marking feature as done:
- [ ] Code written and working
- [ ] Manual testing completed
- [ ] ROADMAP.md updated (checkbox checked, notes added)
- [ ] CHANGELOG.md entry added
- [ ] README.md status updated (if applicable)
- [ ] TECHNICAL_ARCHITECTURE.md updated (if data/API changed)
- [ ] Commit message references docs
- [ ] "Last Updated" date refreshed in modified docs
```

### **Weekly Review Checklist:**

```markdown
Every Friday:
- [ ] Review ROADMAP.md vs actual progress
- [ ] Update timeline estimates
- [ ] Check CHANGELOG.md has all features from this week
- [ ] Verify README.md "Current Status" matches reality
- [ ] Update "Last Updated" dates
- [ ] Note any blockers or delays
- [ ] Plan next week's work
```

---

## 🎓 Documentation Philosophy

**From the Stripe Docs Team:**
> "Documentation is not a phase of development; it's an integral part of shipping features."

**From the Basecamp Team:**
> "If it's not documented, it doesn't exist."

**Our Principle:**
> "Code + Docs = Feature Complete. One without the other is incomplete work."

---

## 🔗 See Also

- [ROADMAP.md](./ROADMAP.md) - Development phases and timeline
- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) - System design
- [CHANGELOG.md](./CHANGELOG.md) - Version history (to be created)
- [README.md](./README.md) - Documentation index

---

**Last Updated:** 2026-03-29
