function checkAuthStatus() {
    fetch('/php/check_authorization.php')
        .then(response => response.json())
        .then(result => {
            if (result.logged_in && result.user) {
                updateHeaderAfterLogin(result.user);
            }
        })
        .catch(error => console.error('Ошибка проверки авторизации:', error));
}


function closeAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}



function showError(inputId, message) {
    const errorEl = document.getElementById(inputId + 'Error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        const input = document.getElementById(inputId);
        if (input) {
            input.style.borderColor = '#ff6b6b';
        }
    }
}

function clearError(inputId) {
    const errorEl = document.getElementById(inputId + 'Error');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
        
        const input = document.getElementById(inputId);
        if (input) {
            input.style.borderColor = '';
        }
    }
}

function clearAllErrors(formType) {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        if (el.id.includes(formType)) {
            el.textContent = '';
            el.style.display = 'none';
        }
    });
    
    const inputs = document.querySelectorAll(`#${formType}Tab input`);
    inputs.forEach(input => {
        input.style.borderColor = '';
    });
}

function validateRegisterForm() {
    let isValid = true;
    
    clearAllErrors('register');
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const terms = document.getElementById('registerTerms').checked;
    
    if (username.length < 3) {
        showError('registerUsername', 'Имя должно быть не менее 3 символов');
        isValid = false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('registerEmail', 'Введите корректный email');
        isValid = false;
    }
    
    if (password.length < 6) {
        showError('registerPassword', 'Пароль должен быть не менее 6 символов');
        isValid = false;
    }
    
    if (password !== confirmPassword) {
        showError('registerConfirmPassword', 'Пароли не совпадают');
        isValid = false;
    }
    
    if (!terms) {
        showError('registerTerms', 'Необходимо принять условия');
        isValid = false;
    }
    
    return isValid;
}

async function submitRegisterForm(event) {
    event.preventDefault();
    
    if (!validateRegisterForm()) {
        return false;
    }
    
    const formData = {
        username: document.getElementById('registerUsername').value.trim(),
        email: document.getElementById('registerEmail').value.trim(),
        password: document.getElementById('registerPassword').value
    };
    
    const submitBtn = event.target.querySelector('.modal-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Регистрация...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/php/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            closeAuthModal();
            
            document.getElementById('registerForm').reset();
            clearAllErrors('register');
            
            
        } else {
            if (result.field) {
                showError('register' + result.field.charAt(0).toUpperCase() + result.field.slice(1), result.message);
            } else {
                alert('Ошибка: ' + result.message);
            }
        }
        
    } catch (error) {
        console.error('Ошибка сети:', error);
        alert('Произошла ошибка сети. Проверьте подключение.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function validateLoginForm() {
    let isValid = true;
    clearAllErrors('login');
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('loginEmail', 'Введите корректный email');
        isValid = false;
    }
    
    if (password.length < 1) {
        showError('loginPassword', 'Введите пароль');
        isValid = false;
    }
    
    return isValid;
}

async function submitLoginForm(event) {
    event.preventDefault();
    
    if (!validateLoginForm()) {
        return false;
    }
    
    const formData = {
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value
    };
    
    const submitBtn = event.target.querySelector('.modal-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Вход...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/php/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            closeAuthModal();
            
            document.getElementById('loginForm').reset();
            clearAllErrors('login');
            
            updateHeaderAfterLogin(result.user);
            
        } else {
            if (result.field) {
                showError('login' + result.field.charAt(0).toUpperCase() + result.field.slice(1), result.message);
            } else {
                alert('Ошибка: ' + result.message);
            }
        }
        
    } catch (error) {
        console.error('Ошибка сети:', error);
        alert('Произошла ошибка сети. Проверьте подключение.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function updateHeaderAfterLogin(user) {
    const authLinks = document.querySelector('.auth-links');
    if (authLinks && user) {
        authLinks.innerHTML = `
            
            <a href="/html/profile.html" class="profile">${user.name}</a>
            <span class="sep">/</span>
            <a href="#" class="logout">Выйти</a>
        `;
        
        const logoutBtn = document.querySelector('.logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
    }
}

function logoutUser() {
    fetch('/php/logout.php')
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                location.reload(); 
            }
        });
}

function initValidation() {
    console.log('Инициализация валидации форм...');
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', submitRegisterForm);
        
        const registerInputs = registerForm.querySelectorAll('input');
        registerInputs.forEach(input => {
            input.addEventListener('input', function() {
                clearError(this.id);
            });
        });
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', submitLoginForm);
        
        const loginInputs = loginForm.querySelectorAll('input');
        loginInputs.forEach(input => {
            input.addEventListener('input', function() {
                clearError(this.id);
            });
        });
    }
    
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Восстановление пароля будет реализовано позже');
        });
    }
}


function updateHeaderAfterLogin(user) {
    const authLinks = document.querySelector('.auth-links');
    if (authLinks && user) {
        authLinks.innerHTML = `
            <a href="/html/profile.html" class="profile">${user.name}</a>
            <span class="sep">/</span>
            <a href="#" class="logout">Выйти</a>
        `;
        
        const logoutBtn = document.querySelector('.logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
        
        if (window.favoritesManager) {
            setTimeout(() => {
                window.favoritesManager.refreshStars();
            }, 500);
        }
    }
}

function logoutUser() {
    fetch('/php/logout.php')
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                if (window.favoritesManager) {
                    setTimeout(() => {
                        window.favoritesManager.refreshStars();
                    }, 100);
                }
                location.reload(); 
            }
        });
}

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    function tryInitValidation() {
        if (document.getElementById('registerForm')) {
            initValidation();
            console.log('Валидация форм инициализирована');
        } else {
            setTimeout(tryInitValidation, 100);
        }
    }
    
    setTimeout(tryInitValidation, 200);
});