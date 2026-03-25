// Polish & Optimization - Loading States, Error Handling, UX Improvements

class PolishManager {
    constructor() {
        this.loadingOverlay = null;
        this.init();
    }

    init() {
        this.createLoadingOverlay();
        this.enhanceErrorHandling();
        this.addOptimisticUpdates();
        this.improveConfirmations();
    }

    createLoadingOverlay() {
        // Create global loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay hidden';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-text">Processing...</p>
            </div>
        `;
        document.body.appendChild(overlay);
        this.loadingOverlay = overlay;
    }

    showLoading(message = 'Processing...') {
        if (this.loadingOverlay) {
            const text = this.loadingOverlay.querySelector('.loading-text');
            if (text) text.textContent = message;
            this.loadingOverlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    enhanceErrorHandling() {
        // Global error handler for fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);

                // Handle HTTP errors
                if (!response.ok && response.status >= 500) {
                    this.showError('Server error. Please try again later.');
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response;
            } catch (error) {
                if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                    this.showError('Network error. Please check your connection.');
                }
                throw error;
            }
        };

        // Global unhandled error handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showError('An unexpected error occurred. Please refresh the page.');
        });
    }

    addOptimisticUpdates() {
        // Intercept inline edit saves for optimistic UI
        const originalSaveEdit = window.inlineEditor?.saveEdit;
        if (originalSaveEdit && window.inlineEditor) {
            window.inlineEditor.saveEdit = async function(activity) {
                const details = activity.querySelector('.activity-details');
                const title = details.querySelector('h4');
                const time = activity.querySelector('.activity-time');

                // Store new values
                const newTitle = title.textContent.trim();
                const newTime = time.textContent.trim();

                // Show loading immediately
                window.polishManager.showLoading('Saving changes...');

                try {
                    // Call original save method
                    await originalSaveEdit.call(this, activity);
                    window.polishManager.hideLoading();
                } catch (error) {
                    // Revert on error
                    title.textContent = activity.dataset.originalTitle;
                    time.textContent = activity.dataset.originalTime;
                    window.polishManager.hideLoading();
                    window.polishManager.showError('Failed to save. Changes reverted.');
                }
            };
        }
    }

    improveConfirmations() {
        // Replace browser confirm with custom modal
        this.createConfirmModal();
    }

    createConfirmModal() {
        const modal = document.createElement('div');
        modal.id = 'confirmModal';
        modal.className = 'confirm-modal hidden';
        modal.innerHTML = `
            <div class="confirm-backdrop"></div>
            <div class="confirm-dialog">
                <div class="confirm-icon">⚠️</div>
                <h3 class="confirm-title">Confirm Action</h3>
                <p class="confirm-message"></p>
                <div class="confirm-actions">
                    <button class="confirm-btn confirm-cancel">Cancel</button>
                    <button class="confirm-btn confirm-ok">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Store modal reference
        this.confirmModal = modal;

        // Event listeners
        modal.querySelector('.confirm-cancel').addEventListener('click', () => {
            this.hideConfirm(false);
        });

        modal.querySelector('.confirm-backdrop').addEventListener('click', () => {
            this.hideConfirm(false);
        });
    }

    showConfirm(message, onConfirm, onCancel) {
        if (!this.confirmModal) return;

        const messageEl = this.confirmModal.querySelector('.confirm-message');
        const okBtn = this.confirmModal.querySelector('.confirm-ok');

        messageEl.textContent = message;

        // Remove old listener and add new one
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);

        newOkBtn.addEventListener('click', () => {
            this.hideConfirm(true);
            if (onConfirm) onConfirm();
        });

        this.confirmModal.classList.remove('hidden');
        this.confirmResolve = { onConfirm, onCancel };
    }

    hideConfirm(confirmed) {
        if (!this.confirmModal) return;
        this.confirmModal.classList.add('hidden');

        if (!confirmed && this.confirmResolve?.onCancel) {
            this.confirmResolve.onCancel();
        }
    }

    showError(message, duration = 5000) {
        if (window.versionControl) {
            window.versionControl.showToast(message, 'error', duration);
        } else {
            alert(message);
        }
    }

    showSuccess(message, duration = 3000) {
        if (window.versionControl) {
            window.versionControl.showToast(message, 'success', duration);
        }
    }

    // Debounce helper for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle helper for performance
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Enhanced inline editor with loading states
function enhanceInlineEditor() {
    if (!window.inlineEditor) return;

    const originalDelete = window.inlineEditor.deleteActivity;
    window.inlineEditor.deleteActivity = async function(activity) {
        const details = activity.querySelector('.activity-details');
        const title = details.querySelector('h4')?.textContent.trim();

        // Use custom confirm
        window.polishManager.showConfirm(
            `Are you sure you want to delete "${title}"? This action cannot be undone.`,
            async () => {
                window.polishManager.showLoading('Deleting activity...');
                try {
                    await originalDelete.call(this, activity);
                    window.polishManager.hideLoading();
                } catch (error) {
                    window.polishManager.hideLoading();
                    window.polishManager.showError('Failed to delete activity');
                }
            }
        );
    };
}

// Enhanced version control with loading states
function enhanceVersionControl() {
    if (!window.versionControl) return;

    const originalUndo = window.versionControl.undo;
    window.versionControl.undo = async function() {
        window.polishManager.showLoading('Undoing change...');
        try {
            await originalUndo.call(this);
        } finally {
            setTimeout(() => window.polishManager.hideLoading(), 500);
        }
    };

    const originalRedo = window.versionControl.redo;
    window.versionControl.redo = async function() {
        window.polishManager.showLoading('Redoing change...');
        try {
            await originalRedo.call(this);
        } finally {
            setTimeout(() => window.polishManager.hideLoading(), 500);
        }
    };
}

// Performance monitoring
function setupPerformanceMonitoring() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > 100) {
                    console.warn('Long task detected:', entry.name, entry.duration + 'ms');
                }
            }
        });

        try {
            observer.observe({ entryTypes: ['measure', 'navigation'] });
        } catch (e) {
            // Browser doesn't support this entry type
        }
    }
}

// Initialize polish manager
document.addEventListener('DOMContentLoaded', () => {
    window.polishManager = new PolishManager();

    // Wait for other components to load, then enhance them
    setTimeout(() => {
        enhanceInlineEditor();
        enhanceVersionControl();
        setupPerformanceMonitoring();
    }, 100);
});

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Lazy load images for better performance
document.addEventListener('DOMContentLoaded', () => {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
});

// Add connection status indicator
function addConnectionIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'connectionStatus';
    indicator.className = 'connection-status online';
    indicator.innerHTML = '<span class="status-dot"></span>';
    document.body.appendChild(indicator);

    window.addEventListener('online', () => {
        indicator.className = 'connection-status online';
        window.polishManager?.showSuccess('Connection restored');
    });

    window.addEventListener('offline', () => {
        indicator.className = 'connection-status offline';
        window.polishManager?.showError('No internet connection', 0);
    });
}

document.addEventListener('DOMContentLoaded', addConnectionIndicator);
