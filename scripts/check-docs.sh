#!/bin/bash

# WayWeave Documentation Health Check
# Run this weekly to ensure docs stay in sync with code

set -e

echo "📚 WayWeave Documentation Health Check"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check if we're in a git repo
if [ ! -d .git ]; then
    echo "${RED}❌ Not a git repository${NC}"
    exit 1
fi

# Function to get last commit date for path
get_last_commit_date() {
    git log -1 --format="%ai" -- "$1" 2>/dev/null || echo "Never committed"
}

# Function to calculate days since last update
days_since() {
    local commit_date=$(git log -1 --format="%at" -- "$1" 2>/dev/null)
    if [ -z "$commit_date" ]; then
        echo "999" # Never committed
    else
        local now=$(date +%s)
        local diff=$((now - commit_date))
        echo $((diff / 86400)) # Convert seconds to days
    fi
}

echo "📅 Last Update Dates"
echo "-------------------"

# Check documentation files
DOCS_DIR="docs"
if [ -d "$DOCS_DIR" ]; then
    for doc in ROADMAP.md TECHNICAL_ARCHITECTURE.md PRODUCT_VISION.md CHANGELOG.md; do
        if [ -f "$DOCS_DIR/$doc" ]; then
            last_update=$(get_last_commit_date "$DOCS_DIR/$doc")
            days=$(days_since "$DOCS_DIR/$doc")

            if [ "$days" -lt 3 ]; then
                echo "${GREEN}✅ $doc: $last_update (${days}d ago)${NC}"
            elif [ "$days" -lt 7 ]; then
                echo "${YELLOW}⚠️  $doc: $last_update (${days}d ago)${NC}"
            else
                echo "${RED}❌ $doc: $last_update (${days}d ago) - STALE!${NC}"
            fi
        else
            echo "${RED}❌ $doc: NOT FOUND${NC}"
        fi
    done
else
    echo "${RED}❌ docs/ directory not found${NC}"
    exit 1
fi

echo ""
echo "💻 Last Code Update"
echo "-------------------"

# Check code files
CODE_EXTENSIONS="js html css"
latest_code_date=""
latest_code_days=0

for ext in $CODE_EXTENSIONS; do
    date=$(get_last_commit_date "*.$ext")
    days=$(days_since "*.$ext")

    if [ "$days" -lt "$latest_code_days" ] || [ -z "$latest_code_date" ]; then
        latest_code_date=$date
        latest_code_days=$days
    fi
done

echo "Last code commit: $latest_code_date (${latest_code_days}d ago)"

echo ""
echo "🔍 Sync Analysis"
echo "----------------"

# Compare docs vs code freshness
roadmap_days=$(days_since "$DOCS_DIR/ROADMAP.md")
changelog_days=$(days_since "$DOCS_DIR/CHANGELOG.md")

if [ "$latest_code_days" -lt 1 ] && [ "$changelog_days" -gt 1 ]; then
    echo "${RED}❌ Code updated today but CHANGELOG.md not updated!${NC}"
    echo "   Action: Update docs/CHANGELOG.md with recent changes"
    DOC_HEALTH="RED"
elif [ "$latest_code_days" -lt 7 ] && [ "$roadmap_days" -gt 7 ]; then
    echo "${YELLOW}⚠️  Code updated this week but ROADMAP.md stale${NC}"
    echo "   Action: Review and update docs/ROADMAP.md"
    DOC_HEALTH="YELLOW"
elif [ "$roadmap_days" -gt 30 ]; then
    echo "${RED}❌ ROADMAP.md over 1 month old - likely out of sync${NC}"
    echo "   Action: Dedicate time to update all documentation"
    DOC_HEALTH="RED"
else
    echo "${GREEN}✅ Documentation appears in sync with code${NC}"
    DOC_HEALTH="GREEN"
fi

echo ""
echo "📊 Documentation Coverage"
echo "------------------------"

# Count features in ROADMAP.md
if [ -f "$DOCS_DIR/ROADMAP.md" ]; then
    completed=$(grep -c "\[x\]" "$DOCS_DIR/ROADMAP.md" || echo "0")
    in_progress=$(grep -c "🚧" "$DOCS_DIR/ROADMAP.md" || echo "0")
    planned=$(grep -c "\[ \]" "$DOCS_DIR/ROADMAP.md" || echo "0")

    echo "Features in ROADMAP.md:"
    echo "  ✅ Completed: $completed"
    echo "  🚧 In Progress: $in_progress"
    echo "  📋 Planned: $planned"
else
    echo "${RED}❌ ROADMAP.md not found${NC}"
fi

echo ""
echo "📝 Recent Commits"
echo "-----------------"

# Show last 5 commits
echo "Last 5 commits:"
git log -5 --oneline --decorate --color=always

echo ""
echo "🔔 Recommendations"
echo "------------------"

if [ "$DOC_HEALTH" == "RED" ]; then
    echo "${RED}🚨 URGENT: Stop coding, update docs immediately${NC}"
    echo ""
    echo "Steps:"
    echo "  1. Review recent code changes: git log --since='1 week ago'"
    echo "  2. Update docs/CHANGELOG.md with all changes"
    echo "  3. Update docs/ROADMAP.md to mark completed features"
    echo "  4. Update docs/README.md 'Current Status' section"
    echo "  5. Commit: git add docs/ && git commit -m 'docs: sync with recent changes'"
elif [ "$DOC_HEALTH" == "YELLOW" ]; then
    echo "${YELLOW}⚠️  WARNING: Docs getting stale, update soon${NC}"
    echo ""
    echo "Block 30 min to:"
    echo "  1. Update docs/ROADMAP.md with progress"
    echo "  2. Add recent changes to docs/CHANGELOG.md"
    echo "  3. Verify docs/README.md reflects current state"
else
    echo "${GREEN}✅ Docs are healthy! Keep it up.${NC}"
    echo ""
    echo "Continue following the workflow:"
    echo "  1. Update docs when completing features"
    echo "  2. Run this check weekly (every Friday)"
    echo "  3. Commit docs with code changes"
fi

echo ""
echo "========================================"
echo "📋 Weekly Review Checklist"
echo "========================================"
echo ""
echo "Before next week:"
echo "  [ ] Updated ROADMAP.md (mark completed features)"
echo "  [ ] Updated CHANGELOG.md (document changes)"
echo "  [ ] Updated README.md (current status)"
echo "  [ ] Reviewed technical debt"
echo "  [ ] Planned next week's work"
echo ""

# Exit code based on health
if [ "$DOC_HEALTH" == "RED" ]; then
    exit 2
elif [ "$DOC_HEALTH" == "YELLOW" ]; then
    exit 1
else
    exit 0
fi
