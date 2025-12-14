document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initProfile, 300);
});

function initProfile() {
    console.log('Инициализация личного кабинета...');
    
    checkProfileAuth();
    
    initProfileButtons();
}

function checkProfileAuth() {
    fetch('/php/check_authorization.php')
        .then(response => response.json())
        .then(result => {
            if (!result.logged_in) {
                alert('Для доступа к личному кабинету необходимо войти в систему');
                window.location.href = '/';
            } else {
                loadUserData();
                loadFavorites();
                checkAdminRights();
            }
        })
        .catch(error => {
            console.error('Ошибка проверки авторизации:', error);
        });
}

function loadUserData() {
    fetch('/php/get_user_data.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('userName').textContent = data.user.name;
                document.getElementById('userEmail').textContent = data.user.email;
                document.getElementById('userRegDate').textContent = formatDate(data.user.reg_date);

                if (data.user.role === 'admin') {
                    
                    document.getElementById('adminSection').style.display = 'block';
                }

            } else {
                showErrorMessage(data.message || 'Ошибка загрузки данных');
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки данных пользователя:', error);
            showErrorMessage('Ошибка соединения с сервером');
        });
}




function initProfileButtons() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Вы уверены, что хотите выйти?')) {
                logoutUser();
            }
        });
    }
    
    const changePassBtn = document.getElementById('changePasswordBtn');
    if (changePassBtn) {
        changePassBtn.addEventListener('click', function() {
            alert('Функция смены пароля будет реализована позже');
        });
    }
}


function formatDate(dateString) {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function showErrorMessage(message) {
    document.getElementById('userName').textContent = message;
    document.getElementById('userEmail').textContent = '—';
    document.getElementById('userRegDate').textContent = '—';
}

function logoutUser() {
    fetch('/php/logout.php')
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                window.location.href = '/';
            }
        });
}