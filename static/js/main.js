// ========================
// Modern PDF Master JavaScript
// ========================

// ========================
// Theme Toggle with Enhanced Features
// ========================
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.body = document.body;
        this.init();
    }

    init() {
        // Load saved theme or default to light mode
        const savedTheme = localStorage.getItem('theme') || 'light-mode';
        this.setTheme(savedTheme);
        
        // Add event listener for theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Update theme toggle icon
        this.updateThemeIcon();
    }

    setTheme(theme) {
        this.body.className = this.body.className.replace(/\b(light-mode|dark-mode)\b/g, '');
        this.body.classList.add(theme);
        localStorage.setItem('theme', theme);
        this.updateThemeIcon();
    }

    toggleTheme() {
        const currentTheme = this.body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode';
        const newTheme = currentTheme === 'dark-mode' ? 'light-mode' : 'dark-mode';
        this.setTheme(newTheme);
    }

    updateThemeIcon() {
        const icon = this.themeToggle.querySelector('i');
        if (this.body.classList.contains('dark-mode')) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
}

// ========================
// Enhanced File Upload Handler
// ========================
class FileUploadHandler {
    constructor() {
        this.uploadAreas = document.querySelectorAll('.upload-area');
        this.init();
    }

    init() {
        this.uploadAreas.forEach(area => {
            const fileInput = area.querySelector('input[type="file"]');
            const selectedFilesElem = area.querySelector('.selected-files');
            
            // Drag and drop events
            area.addEventListener('dragover', (e) => this.handleDragOver(e, area));
            area.addEventListener('dragleave', (e) => this.handleDragLeave(e, area));
            area.addEventListener('drop', (e) => this.handleDrop(e, area, fileInput, selectedFilesElem));
            
            // File input change event
            fileInput.addEventListener('change', () => this.updateSelectedFilesList(fileInput.files, selectedFilesElem));
            
            // Click to upload
            area.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    fileInput.click();
                }
            });
        });
    }

    handleDragOver(e, area) {
        e.preventDefault();
        area.classList.add('dragging');
        area.style.borderColor = 'var(--primary-green)';
        area.style.backgroundColor = 'var(--primary-green-ultra-light)';
    }

    handleDragLeave(e, area) {
        // Only remove dragging state if we're actually leaving the area
        if (!area.contains(e.relatedTarget)) {
            area.classList.remove('dragging');
            area.style.borderColor = '';
            area.style.backgroundColor = '';
        }
    }

    handleDrop(e, area, fileInput, selectedFilesElem) {
        e.preventDefault();
        area.classList.remove('dragging');
        area.style.borderColor = '';
        area.style.backgroundColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            this.updateSelectedFilesList(files, selectedFilesElem);
            this.showSuccessState(area);
        }
    }

    updateSelectedFilesList(files, selectedFilesElem) {
        if (!files || files.length === 0) {
            selectedFilesElem.textContent = '';
            return;
        }
        
        const fileNames = Array.from(files).map(f => f.name);
        const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
        const sizeText = this.formatFileSize(totalSize);
        
        if (files.length === 1) {
            selectedFilesElem.innerHTML = `<strong>${fileNames[0]}</strong> (${sizeText})`;
        } else {
            selectedFilesElem.innerHTML = `<strong>${files.length} files selected</strong> (${sizeText})`;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showSuccessState(area) {
        area.classList.add('success');
        setTimeout(() => {
            area.classList.remove('success');
        }, 2000);
    }
}

// ========================
// Enhanced Form Submission Handler
// ========================
class FormSubmissionHandler {
    constructor() {
        this.forms = document.querySelectorAll('form');
        this.init();
    }

    init() {
        this.forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSubmit(e, form));
        });
    }

    async handleSubmit(event, form) {
        event.preventDefault();

        // Validate files
        if (!this.validateFiles(form)) {
            this.showNotification('Please select at least one file before submitting.', 'error');
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('.convert-btn');
        this.setLoadingState(submitBtn, true);
        
        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            // Handle successful response
            await this.handleSuccessfulResponse(response, submitBtn);
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Something went wrong. Please try again.', 'error');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    validateFiles(form) {
        let hasFile = false;
        form.querySelectorAll('input[type="file"]').forEach(input => {
            if (input.files && input.files.length > 0) {
                hasFile = true;
            }
        });
        return hasFile;
    }

    setLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            const originalText = button.innerHTML;
            button.setAttribute('data-original-text', originalText);
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.innerHTML = originalText;
            }
        }
    }

    async handleSuccessfulResponse(response, button) {
        const blob = await response.blob();
        const filename = this.extractFilename(response) || 'download';
        
        // Trigger download
        this.downloadBlob(blob, filename);
        
        // Show success message
        this.showNotification('File processed successfully!', 'success');
        
        // Animate button success state
        this.showButtonSuccess(button);
    }

    extractFilename(response) {
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition && contentDisposition.includes('filename=')) {
            return contentDisposition
                .split('filename=')[1]
                .replace(/["']/g, '')
                .trim();
        }
        return null;
    }

    downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }

    showButtonSuccess(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Success!';
        button.style.background = 'var(--primary-green)';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }

    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                padding: 1rem 1.5rem;
                border-radius: 0.75rem;
                font-weight: 500;
                color: white;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                max-width: 400px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(notification);
        }

        // Set message and style based on type
        notification.textContent = message;
        if (type === 'success') {
            notification.style.background = 'var(--primary-green)';
        } else if (type === 'error') {
            notification.style.background = '#ef4444';
        } else {
            notification.style.background = 'var(--gray-600)';
        }

        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Hide notification after 4 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
        }, 4000);
    }
}

// ========================
// Smooth Scrolling for Anchor Links
// ========================
class SmoothScroller {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').slice(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// ========================
// Card Animation Observer
// ========================
class CardAnimator {
    constructor() {
        this.init();
    }

    init() {
        const cards = document.querySelectorAll('.feature-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate-fade-in-up');
                    }, index * 100);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        cards.forEach(card => {
            observer.observe(card);
        });
    }
}

// ========================
// Initialize Everything
// ========================
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new FileUploadHandler();
    new FormSubmissionHandler();
    new SmoothScroller();
    
    // Only initialize card animator if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        new CardAnimator();
    }
});

// ========================
// Progressive Web App Support
// ========================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
