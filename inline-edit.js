// Inline Editing & Drag-and-Drop for Itinerary Items

class InlineEditor {
    constructor() {
        this.currentEditingElement = null;
        this.draggedElement = null;
        this.init();
    }

    init() {
        this.addEditControls();
        this.setupDragAndDrop();
        this.setupEventListeners();
    }

    addEditControls() {
        // Add edit buttons to all activity items
        const activities = document.querySelectorAll('.activity');

        activities.forEach((activity, index) => {
            // Skip if controls already added
            if (activity.querySelector('.edit-controls')) return;

            const controls = document.createElement('div');
            controls.className = 'edit-controls';
            controls.innerHTML = `
                <button class="edit-btn" title="Edit" data-action="edit">
                    <span>✏️</span>
                </button>
                <button class="delete-btn" title="Delete" data-action="delete">
                    <span>🗑️</span>
                </button>
                <button class="duplicate-btn" title="Duplicate" data-action="duplicate">
                    <span>📋</span>
                </button>
                <button class="drag-handle" title="Drag to reorder" draggable="true">
                    <span>⋮⋮</span>
                </button>
            `;

            // Insert controls at the beginning of activity
            activity.style.position = 'relative';
            activity.insertBefore(controls, activity.firstChild);
        });
    }

    setupDragAndDrop() {
        const activities = document.querySelectorAll('.activity');

        activities.forEach(activity => {
            const dragHandle = activity.querySelector('.drag-handle');

            if (dragHandle) {
                dragHandle.addEventListener('dragstart', (e) => this.handleDragStart(e, activity));
                activity.addEventListener('dragover', (e) => this.handleDragOver(e));
                activity.addEventListener('drop', (e) => this.handleDrop(e, activity));
                activity.addEventListener('dragend', (e) => this.handleDragEnd(e));
            }
        });
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const activity = target.closest('.activity');

            switch(action) {
                case 'edit':
                    this.enterEditMode(activity);
                    break;
                case 'delete':
                    this.deleteActivity(activity);
                    break;
                case 'duplicate':
                    this.duplicateActivity(activity);
                    break;
            }
        });
    }

    enterEditMode(activity) {
        if (this.currentEditingElement) {
            this.exitEditMode();
        }

        this.currentEditingElement = activity;
        activity.classList.add('editing');

        const details = activity.querySelector('.activity-details');
        const title = details.querySelector('h4');
        const time = activity.querySelector('.activity-time');

        // Store original values
        activity.dataset.originalTitle = title.textContent;
        activity.dataset.originalTime = time.textContent;

        // Make title editable
        title.contentEditable = 'true';
        title.style.outline = '2px solid #667eea';
        title.style.padding = '4px';
        title.style.borderRadius = '4px';
        title.focus();

        // Make time editable
        time.contentEditable = 'true';
        time.style.outline = '2px solid #667eea';
        time.style.padding = '4px';
        time.style.borderRadius = '4px';

        // Add save/cancel buttons
        const editActions = document.createElement('div');
        editActions.className = 'edit-actions';
        editActions.innerHTML = `
            <button class="save-edit-btn">💾 Save</button>
            <button class="cancel-edit-btn">✖️ Cancel</button>
        `;

        activity.appendChild(editActions);

        // Event listeners for save/cancel
        editActions.querySelector('.save-edit-btn').addEventListener('click', () => this.saveEdit(activity));
        editActions.querySelector('.cancel-edit-btn').addEventListener('click', () => this.cancelEdit(activity));

        // Save on Enter, cancel on Escape
        const keyHandler = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.saveEdit(activity);
            } else if (e.key === 'Escape') {
                this.cancelEdit(activity);
            }
        };

        title.addEventListener('keydown', keyHandler);
        time.addEventListener('keydown', keyHandler);
    }

    async saveEdit(activity) {
        const details = activity.querySelector('.activity-details');
        const title = details.querySelector('h4');
        const time = activity.querySelector('.activity-time');

        const newTitle = title.textContent.trim();
        const newTime = time.textContent.trim();

        const dayCard = activity.closest('.day-card');
        const dayNumber = dayCard?.dataset.day || 'unknown';

        // Save to database
        try {
            const response = await fetch('/api/save-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation_type: 'update',
                    day: `Day ${dayNumber}`,
                    location_id: activity.dataset.originalTitle || newTitle,
                    before_state: {
                        title: activity.dataset.originalTitle,
                        time: activity.dataset.originalTime
                    },
                    after_state: {
                        title: newTitle,
                        time: newTime
                    },
                    description: `Update location from "${activity.dataset.originalTitle}" to "${newTitle}"`
                })
            });

            const result = await response.json();

            if (result.success) {
                window.versionControl?.showToast('Changes saved successfully!', 'success');
                window.versionControl?.loadHistory();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Save error:', error);
            window.versionControl?.showToast('Failed to save changes', 'error');
        }

        this.exitEditMode();
    }

    cancelEdit(activity) {
        const details = activity.querySelector('.activity-details');
        const title = details.querySelector('h4');
        const time = activity.querySelector('.activity-time');

        title.textContent = activity.dataset.originalTitle;
        time.textContent = activity.dataset.originalTime;

        this.exitEditMode();
    }

    exitEditMode() {
        if (!this.currentEditingElement) return;

        const activity = this.currentEditingElement;
        activity.classList.remove('editing');

        const details = activity.querySelector('.activity-details');
        const title = details.querySelector('h4');
        const time = activity.querySelector('.activity-time');

        title.contentEditable = 'false';
        title.style.outline = 'none';
        title.style.padding = '';
        title.style.borderRadius = '';

        time.contentEditable = 'false';
        time.style.outline = 'none';
        time.style.padding = '';
        time.style.borderRadius = '';

        const editActions = activity.querySelector('.edit-actions');
        if (editActions) {
            editActions.remove();
        }

        this.currentEditingElement = null;
    }

    async deleteActivity(activity) {
        if (!confirm('Are you sure you want to delete this activity?')) {
            return;
        }

        const details = activity.querySelector('.activity-details');
        const title = details.querySelector('h4')?.textContent.trim();
        const dayCard = activity.closest('.day-card');
        const dayNumber = dayCard?.dataset.day || 'unknown';

        try {
            const response = await fetch('/api/save-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation_type: 'remove',
                    day: `Day ${dayNumber}`,
                    location_id: title,
                    before_state: { title },
                    after_state: null,
                    description: `Remove "${title}" from Day ${dayNumber}`
                })
            });

            const result = await response.json();

            if (result.success) {
                activity.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    activity.remove();
                    window.versionControl?.showToast('Activity deleted', 'success');
                    window.versionControl?.loadHistory();
                }, 300);
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            console.error('Delete error:', error);
            window.versionControl?.showToast('Failed to delete activity', 'error');
        }
    }

    async duplicateActivity(activity) {
        const clone = activity.cloneNode(true);

        // Remove edit controls from clone (will be re-added)
        const controls = clone.querySelector('.edit-controls');
        if (controls) controls.remove();

        // Insert after current activity
        activity.parentNode.insertBefore(clone, activity.nextSibling);

        // Re-initialize controls
        this.addEditControls();
        this.setupDragAndDrop();

        const details = clone.querySelector('.activity-details');
        const title = details.querySelector('h4')?.textContent.trim();
        const dayCard = activity.closest('.day-card');
        const dayNumber = dayCard?.dataset.day || 'unknown';

        // Save to database
        try {
            await fetch('/api/save-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation_type: 'add',
                    day: `Day ${dayNumber}`,
                    location_id: `${title} (copy)`,
                    after_state: { title: `${title} (copy)` },
                    description: `Duplicate "${title}" on Day ${dayNumber}`
                })
            });

            window.versionControl?.showToast('Activity duplicated', 'success');
            window.versionControl?.loadHistory();
        } catch (error) {
            console.error('Duplicate error:', error);
        }
    }

    handleDragStart(e, activity) {
        this.draggedElement = activity;
        activity.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', activity.innerHTML);
    }

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    async handleDrop(e, targetActivity) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (this.draggedElement !== targetActivity) {
            // Get parent containers
            const draggedParent = this.draggedElement.parentNode;
            const targetParent = targetActivity.parentNode;

            // Reorder within same day
            if (draggedParent === targetParent) {
                const allActivities = Array.from(draggedParent.querySelectorAll('.activity'));
                const draggedIndex = allActivities.indexOf(this.draggedElement);
                const targetIndex = allActivities.indexOf(targetActivity);

                if (draggedIndex < targetIndex) {
                    targetActivity.parentNode.insertBefore(this.draggedElement, targetActivity.nextSibling);
                } else {
                    targetActivity.parentNode.insertBefore(this.draggedElement, targetActivity);
                }

                const dayCard = this.draggedElement.closest('.day-card');
                const dayNumber = dayCard?.dataset.day || 'unknown';
                const title = this.draggedElement.querySelector('h4')?.textContent.trim();

                // Save reorder to database
                await this.saveReorder(title, `Day ${dayNumber}`, targetActivity.querySelector('h4')?.textContent.trim());
            }
            // Move between days
            else {
                const fromDay = this.draggedElement.closest('.day-card')?.dataset.day;
                const toDay = targetActivity.closest('.day-card')?.dataset.day;
                const title = this.draggedElement.querySelector('h4')?.textContent.trim();

                targetParent.insertBefore(this.draggedElement, targetActivity);

                // Save move to database
                await this.saveMove(title, `Day ${fromDay}`, `Day ${toDay}`);
            }

            window.versionControl?.showToast('Activity moved', 'success');
            window.versionControl?.loadHistory();
        }

        return false;
    }

    handleDragEnd(e) {
        if (this.draggedElement) {
            this.draggedElement.style.opacity = '1';
            this.draggedElement = null;
        }
    }

    async saveReorder(locationName, day, afterLocation) {
        try {
            await fetch('/api/save-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation_type: 'reorder',
                    day,
                    location_id: locationName,
                    after_state: { position: `after ${afterLocation}` },
                    description: `Reorder "${locationName}" after "${afterLocation}" on ${day}`
                })
            });
        } catch (error) {
            console.error('Reorder save error:', error);
        }
    }

    async saveMove(locationName, fromDay, toDay) {
        try {
            await fetch('/api/save-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation_type: 'move',
                    day: fromDay,
                    location_id: locationName,
                    before_state: { day: fromDay },
                    after_state: { day: toDay },
                    description: `Move "${locationName}" from ${fromDay} to ${toDay}`
                })
            });
        } catch (error) {
            console.error('Move save error:', error);
        }
    }
}

// Add CSS animation for deletion
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.95); }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.inlineEditor = new InlineEditor();
});
