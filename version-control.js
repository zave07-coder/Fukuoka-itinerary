// Version Control & History Management

class VersionControl {
    constructor() {
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');
        this.historyBtn = document.getElementById('historyBtn');
        this.historySidebar = document.getElementById('historySidebar');
        this.closeHistoryBtn = document.getElementById('closeHistory');
        this.historyContent = document.getElementById('historyContent');
        this.changeCounter = document.getElementById('changeCounter');
        this.toastContainer = document.getElementById('toastContainer');

        this.init();
    }

    init() {
        // Undo/Redo button click handlers
        this.undoBtn.addEventListener('click', () => this.undo());
        this.redoBtn.addEventListener('click', () => this.redo());

        // History sidebar
        this.historyBtn.addEventListener('click', () => this.toggleHistory());
        this.closeHistoryBtn.addEventListener('click', () => this.closeHistory());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        });

        // Load initial history
        this.loadHistory();

        // Refresh history every 30 seconds
        setInterval(() => this.loadHistory(), 30000);
    }

    async undo() {
        this.showToast('Processing undo...', 'info');

        try {
            const response = await fetch('/api/undo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Change undone successfully!', 'success');
                this.loadHistory();
                // Trigger page reload or update UI
                setTimeout(() => location.reload(), 1000);
            } else {
                this.showToast(data.message || 'Nothing to undo', 'info');
            }
        } catch (error) {
            console.error('Undo error:', error);
            this.showToast('Failed to undo change', 'error');
        }
    }

    async redo() {
        this.showToast('Processing redo...', 'info');

        try {
            const response = await fetch('/api/redo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Change redone successfully!', 'success');
                this.loadHistory();
                // Trigger page reload or update UI
                setTimeout(() => location.reload(), 1000);
            } else {
                this.showToast(data.message || 'Nothing to redo', 'info');
            }
        } catch (error) {
            console.error('Redo error:', error);
            this.showToast('Failed to redo change', 'error');
        }
    }

    async loadHistory() {
        try {
            const response = await fetch('/api/get-history?limit=50&includeUndone=true');
            const data = await response.json();

            if (data.success && data.history) {
                this.renderHistory(data.history);
                this.updateControls(data.history);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    renderHistory(history) {
        if (!history || history.length === 0) {
            this.historyContent.innerHTML = '<p class="history-empty">No changes yet. Start editing your itinerary!</p>';
            return;
        }

        this.historyContent.innerHTML = history.map(item => {
            const date = new Date(item.created_at);
            const timeAgo = this.getTimeAgo(date);
            const isUndone = item.is_undone;

            return `
                <div class="history-item ${isUndone ? 'undone' : ''}" data-id="${item.id}">
                    <div class="history-item-header">
                        <span class="history-operation ${item.operation_type}">${item.operation_type}</span>
                        <span class="history-time">${timeAgo}</span>
                    </div>
                    <div class="history-description">${item.description}</div>
                    <div class="history-details">
                        ${item.day ? `Day: ${item.day}` : ''}
                        ${isUndone ? ' • <span style="color: #dc3545;">Undone</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateControls(history) {
        // Count active (non-undone) changes
        const activeChanges = history.filter(h => !h.is_undone).length;
        this.changeCounter.textContent = `${activeChanges} ${activeChanges === 1 ? 'change' : 'changes'}`;

        // Enable/disable undo button
        const hasUndoableChanges = history.some(h => !h.is_undone);
        this.undoBtn.disabled = !hasUndoableChanges;

        // Enable/disable redo button
        const hasRedoableChanges = history.some(h => h.is_undone);
        this.redoBtn.disabled = !hasRedoableChanges;
    }

    toggleHistory() {
        this.historySidebar.classList.toggle('open');
    }

    closeHistory() {
        this.historySidebar.classList.remove('open');
    }

    showToast(message, type = 'info', duration = 3000) {
        const icons = {
            success: '✓',
            error: '✗',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.versionControl = new VersionControl();
});
