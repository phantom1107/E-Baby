// Global variables
let currentForm = 'login';
let isAnimating = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth.js loaded - initializing...'); // Debug log
    initializeAuth();
    setupEventListeners();
    handleFlashMessages();
    setupTermsModal();
    setupEmailAutoComplete();
    setupPasswordValidation();
    setupUserTypeHandling();
    setupFormValidation();
    enhanceInputs();
    console.log('Auth.js initialization complete'); // Debug log
});

// Initialize authentication system
function initializeAuth() {
    // Set initial form state
    showForm('login');
    
    // Add entrance animations
    setTimeout(() => {
        document.querySelector('.auth-container').classList.add('loaded');
    }, 100);
}

// Setup all event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchForm(tab);
        });
    });

    // Email focus/blur for hint
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('focus', showEmailHint);
        emailInput.addEventListener('blur', hideEmailHint);
    }

    // Auto-append @gmail.com
    if (emailInput) {
        emailInput.addEventListener('blur', autoAppendGmail);
    }
}

// Setup email auto-complete functionality
function setupEmailAutoComplete() {
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const val = this.value.trim();
            if (val && !val.includes('@')) {
                this.value = val + '@gmail.com';
            }
        });
    }
}

// Switch between login and register forms with animation
function switchForm(formType) {
    if (isAnimating || formType === currentForm) return;
    
    isAnimating = true;
    const currentWrapper = document.querySelector('.form-wrapper.active');
    const targetWrapper = document.getElementById(`${formType}-form`);
    const currentTab = document.querySelector('.tab-btn.active');
    const targetTab = document.querySelector(`[data-tab="${formType}"]`);
    
    // Determine animation direction
    const direction = formType === 'register' ? 'left' : 'right';
    
    // Update tab states
    currentTab.classList.remove('active');
    targetTab.classList.add('active');
    
    // Animate current form out
    currentWrapper.classList.add(direction === 'left' ? 'slide-out-left' : 'slide-out-right');
    
    setTimeout(() => {
        // Hide current form and show target form
        currentWrapper.classList.remove('active', 'slide-out-left', 'slide-out-right');
        targetWrapper.classList.add('active');
        
        // Reset any form states
        if (formType === 'register') {
            resetRegisterForm();
        }
        
        currentForm = formType;
        isAnimating = false;
        
        // Add entrance animation to new form
        targetWrapper.style.animation = 'none';
        setTimeout(() => {
            targetWrapper.style.animation = 'fadeInUp 0.6s ease-out';
        }, 10);
    }, 250);
}

// Show specific form
function showForm(formType) {
    document.querySelectorAll('.form-wrapper').forEach(wrapper => {
        wrapper.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${formType}-form`).classList.add('active');
    document.querySelector(`[data-tab="${formType}"]`).classList.add('active');
    currentForm = formType;
}

// Reset register form to initial state
function resetRegisterForm() {
    // Hide document upload section
    document.getElementById('document-upload').classList.remove('active');
    document.getElementById('basic-info').classList.add('active');
    
    // Reset buttons
    const nextBtn = document.querySelector('.next-btn');
    const submitBtn = document.getElementById('register-submit-btn');
    
    if (nextBtn) nextBtn.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'block';
    
    // Reset user type
    const userTypeSelect = document.getElementById('user_type');
    if (userTypeSelect) {
        userTypeSelect.value = '';
        userTypeSelect.dispatchEvent(new Event('change'));
    }
}

// Password visibility toggle
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Email hint functionality
function showEmailHint() {
    const hint = document.querySelector('.email-hint');
    if (hint) {
        hint.classList.add('show');
    }
}

function hideEmailHint() {
    const hint = document.querySelector('.email-hint');
    if (hint) {
        hint.classList.remove('show');
    }
}

// Auto-append @gmail.com
function autoAppendGmail() {
    const emailField = document.getElementById('email');
    if (emailField) {
        const val = emailField.value.trim();
        if (val && !val.includes('@')) {
            emailField.value = val + '@gmail.com';
        }
    }
}

// Password validation
function setupPasswordValidation() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');
    const message = document.getElementById('password-match-message');
    
    console.log('Setting up password validation:', { password: !!password, confirmPassword: !!confirmPassword, message: !!message }); // Debug log
    
    if (password && confirmPassword && message) {
        function checkPasswordMatch() {
            if (confirmPassword.value === '') {
                message.textContent = '';
                message.className = '';
                confirmPassword.style.borderColor = '#e5e7eb';
            } else if (password.value === confirmPassword.value) {
                message.textContent = '✓ Passwords match';
                message.className = 'match';
                confirmPassword.style.borderColor = '#10B981';
            } else {
                message.textContent = '✗ Passwords do not match';
                message.className = 'mismatch';
                confirmPassword.style.borderColor = '#EF4444';
            }
        }
        
        password.addEventListener('input', checkPasswordMatch);
        confirmPassword.addEventListener('input', checkPasswordMatch);
        
        // Also trigger on page load if there are values
        if (password.value || confirmPassword.value) {
            checkPasswordMatch();
        }
        
        console.log('Password validation setup complete'); // Debug log
    } else {
        console.log('Password validation elements not found'); // Debug log
    }
}

// User type handling
function setupUserTypeHandling() {
    const userTypeSelect = document.getElementById('user_type');
    if (userTypeSelect) {
        userTypeSelect.addEventListener('change', function() {
            const nextButton = document.querySelector('.next-btn');
            const submitBtn = document.getElementById('register-submit-btn');
            const documentId = document.getElementById('document_id');
            const bir = document.getElementById('bir');
            const documentTitle = document.getElementById('document-title');
            const termsCheckbox = document.getElementById('terms_checkbox');
            
            console.log('User type changed to:', this.value); // Debug log
            
            if (this.value === 'Seller') {
                if (nextButton) nextButton.style.display = 'block';
                if (submitBtn) submitBtn.style.display = 'none';
                if (documentId) documentId.required = true;
                if (bir) bir.required = true;
                if (documentTitle) documentTitle.textContent = 'Required Seller Documents';
                if (termsCheckbox) termsCheckbox.required = true;
            } else if (this.value === 'Rider') {
                if (nextButton) nextButton.style.display = 'block';
                if (submitBtn) submitBtn.style.display = 'none';
                if (documentId) documentId.required = true;
                if (bir) bir.required = false;
                if (documentTitle) documentTitle.textContent = 'Required Rider Documents';
                if (termsCheckbox) termsCheckbox.required = true;
            } else if (this.value === 'Buyer') {
                if (nextButton) nextButton.style.display = 'block';
                if (submitBtn) submitBtn.style.display = 'none';
                if (documentId) documentId.required = true;
                if (bir) bir.required = false;
                if (documentTitle) documentTitle.textContent = 'Required Buyer Documents';
                if (termsCheckbox) termsCheckbox.required = true;
            }
        });
        
        // Trigger change event on page load if there's a value
        if (userTypeSelect.value) {
            userTypeSelect.dispatchEvent(new Event('change'));
        }
    }
}

// Document upload handling
function showDocumentUpload() {
    const userType = document.getElementById('user_type').value;
    const birSection = document.getElementById('bir-section');
    const basicInfo = document.getElementById('basic-info');
    const documentUpload = document.getElementById('document-upload');
    const termsCheckbox = document.getElementById('terms_checkbox');
    const termsHint = document.getElementById('terms-hint');
    
    console.log('Showing document upload for user type:', userType); // Debug log
    
    // Enforce Terms agreement before proceeding
    if (termsCheckbox && !termsCheckbox.checked) {
        if (termsHint) termsHint.style.display = 'block';
        showNotification('Please agree to the Terms and Conditions to continue', 'error');
        return;
    } else if (termsHint) {
        termsHint.style.display = 'none';
    }

    if (userType === 'Seller') {
        if (birSection) birSection.style.display = 'block';
        if (document.getElementById('bir')) document.getElementById('bir').required = true;
    } else if (userType === 'Rider') {
        if (birSection) birSection.style.display = 'none';
        if (document.getElementById('bir')) document.getElementById('bir').required = false;
    }
    
    // Animate transition
    if (basicInfo && documentUpload) {
        basicInfo.classList.remove('active');
        documentUpload.classList.add('active');
        
        // Smooth scroll to documents section
        setTimeout(() => {
            documentUpload.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function hideDocumentUpload() {
    const basicInfo = document.getElementById('basic-info');
    const documentUpload = document.getElementById('document-upload');
    
    console.log('Hiding document upload'); // Debug log
    
    if (basicInfo && documentUpload) {
        documentUpload.classList.remove('active');
        basicInfo.classList.add('active');
        
        // Smooth scroll to top
        setTimeout(() => {
            basicInfo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// Terms and conditions modal
function setupTermsModal() {
    const openTerms = document.getElementById('open_terms');
    const termsModal = document.getElementById('termsModal');
    const closeTerms = document.getElementById('close_terms');
    const acceptTerms = document.getElementById('accept_terms');
    const termsCheckbox = document.getElementById('terms_checkbox');
    
    if (openTerms && termsModal) {
        openTerms.addEventListener('click', function(e) {
            e.preventDefault();
            termsModal.style.display = 'block';
        });
    }
    
    if (closeTerms && termsModal) {
        closeTerms.addEventListener('click', function() {
            termsModal.style.display = 'none';
        });
    }
    
    if (acceptTerms && termsModal && termsCheckbox) {
        acceptTerms.addEventListener('click', function() {
            termsCheckbox.checked = true;
            termsModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    if (termsModal) {
        termsModal.addEventListener('click', function(e) {
            if (e.target === termsModal) {
                termsModal.style.display = 'none';
            }
        });
    }
}

// Flash messages handling
function handleFlashMessages() {
    const errorModal = document.getElementById('errorModal');
    if (errorModal) {
        const errorMessage = errorModal.getAttribute('data-error');
        // Don't auto-show the error modal - let it stay hidden
        // Error message will be handled by server-side flash messages
    }
}

// Error modal handling
function closeErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Form validation
function setupFormValidation() {
    // Login form validation
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = document.getElementById('login_email').value;
            const password = document.getElementById('login_password').value;
            
            if (!email || !password) {
                e.preventDefault();
                showNotification('Please fill in all fields', 'error');
                return;
            }
        });
    }
    
    // Register form validation
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const userType = document.getElementById('user_type').value;
            const termsChecked = document.getElementById('terms_checkbox') ? document.getElementById('terms_checkbox').checked : true;
            
            if (!termsChecked) {
                e.preventDefault();
                showNotification('Please agree to the Terms and Conditions', 'error');
                return;
            }
            
            if (userType === '') {
                e.preventDefault();
                showNotification('Please select a user type', 'error');
                return;
            }
            
            // Additional validation for sellers and riders
            if (userType === 'Seller' || userType === 'Rider') {
                const documentId = document.getElementById('document_id');
                if (!documentId || !documentId.files || documentId.files.length === 0) {
                    e.preventDefault();
                    showNotification('Please upload a valid ID document', 'error');
                    // auto-open documents step if user tried to submit from basic info
                    showDocumentUpload();
                    return;
                }

                if (userType === 'Seller') {
                    const bir = document.getElementById('bir');
                    if (!bir || !bir.files || bir.files.length === 0) {
                        e.preventDefault();
                        showNotification('Please upload a BIR document', 'error');
                        showDocumentUpload();
                        return;
                    }
                }
            }
        });
    }
}

// Notification system
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        font-weight: 500;
    `;
    
    if (type === 'success') {
        notification.style.backgroundColor = 'var(--success-color)';
        notification.style.color = 'white';
    } else {
        notification.style.backgroundColor = 'var(--error-color)';
        notification.style.color = 'white';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Smooth scroll polyfill for older browsers
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function(options) {
        const element = this;
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (options && options.behavior === 'smooth') {
            const targetScrollTop = elementTop - (windowHeight - elementHeight) / 2;
            const startScrollTop = scrollTop;
            const distance = targetScrollTop - startScrollTop;
            const duration = 500;
            let start = null;
            
            function animation(currentTime) {
                if (start === null) start = currentTime;
                const timeElapsed = currentTime - start;
                const progress = Math.min(timeElapsed / duration, 1);
                const ease = progress * (2 - progress); // ease-out
                
                window.scrollTo(0, startScrollTop + distance * ease);
                
                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                }
            }
            
            requestAnimationFrame(animation);
        } else {
            window.scrollTo(0, elementTop);
        }
    };
}

// Input UX enhancements (email/phone)
function enhanceInputs() {
    const email = document.getElementById('email');
    const phone = document.getElementById('phone_number');

    if (email) {
        email.setAttribute('autocomplete', 'email');
        email.setAttribute('spellcheck', 'false');
        email.setAttribute('autocapitalize', 'off');
    }

    if (phone) {
        phone.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }
}
