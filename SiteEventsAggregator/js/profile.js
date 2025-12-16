document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initProfile, 300);
});

function initProfile() {
    console.log('Инициализация личного кабинета...');
    
    checkProfileAuth();
    initProfileButtons();
    initEventForm();
    initFavoritesView();
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
            } else {
                showErrorMessage(data.message || 'Ошибка загрузки данных');
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки данных пользователя:', error);
            showErrorMessage('Ошибка соединения с сервером');
        });
}

function checkAdminRights() {
    fetch('/php/get_user_data.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user.role === 'admin') {
                document.getElementById('adminSection').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Ошибка проверки прав администратора:', error);
        });
}

function initFavoritesView() {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const viewType = this.getAttribute('data-view');
            switchView(viewType);
            
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            localStorage.setItem('favoritesView', viewType);
        });
    });
    
    const savedView = localStorage.getItem('favoritesView') || 'table';
    const savedBtn = document.querySelector(`.view-btn[data-view="${savedView}"]`);
    if (savedBtn) {
        savedBtn.classList.add('active');
        switchView(savedView);
    }
    
    const clearBtn = document.getElementById('clearFavoritesBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllFavorites);
    }
}

function switchView(viewType) {
    const favoritesList = document.getElementById('favoritesList');
    const currentView = favoritesList.getAttribute('data-view') || 'table';
    
    if (currentView === viewType) return;
    
    favoritesList.setAttribute('data-view', viewType);
    
    if (window.currentFavorites && window.currentFavorites.length > 0) {
        displayFavorites(window.currentFavorites);
    }
}

function loadFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    if (!favoritesList) return;
    
    favoritesList.innerHTML = `
        <div class="loading-favorites">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка избранных событий...</p>
        </div>
    `;
    
    fetch('/php/get_favorites.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.events && data.events.length > 0) {
                window.currentFavorites = data.events;
                displayFavorites(data.events);
                updateFavoritesCount(data.events.length);
            } else {
                window.currentFavorites = [];
                favoritesList.innerHTML = `
                    <div class="no-favorites">
                        <i class="far fa-star"></i>
                        <h3>У вас пока нет избранных событий</h3>
                        <p>Нажмите на звездочку на любом событии, чтобы добавить его сюда</p>
                        <a href="/html/mainPage.html" class="btn-browse-events">
                            <i class="fas fa-calendar-alt"></i> Посмотреть события
                        </a>
                    </div>
                `;
                updateFavoritesCount(0);
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки избранного:', error);
            favoritesList.innerHTML = `
                <div class="error-loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Ошибка загрузки</h3>
                    <p>Не удалось загрузить избранные события</p>
                    <button onclick="loadFavorites()" class="btn-retry">
                        <i class="fas fa-redo"></i> Попробовать снова
                    </button>
                </div>
            `;
        });
}

function updateFavoritesCount(count) {
    const countElement = document.getElementById('favoritesCount');
    if (countElement) {
        countElement.textContent = `(${count})`;
    }
}

function displayFavorites(events) {
    const favoritesList = document.getElementById('favoritesList');
    const viewType = favoritesList.getAttribute('data-view') || 'table';
    
    switch(viewType) {
        case 'table':
            displayTableView(events);
            break;
        case 'grid':
            displayGridView(events);
            break;
        case 'list':
            displayListView(events);
            break;
        default:
            displayTableView(events);
    }
    
    updateFavoritesCount(events.length);
}

function displayTableView(events) {
    const favoritesList = document.getElementById('favoritesList');
    
    favoritesList.innerHTML = `
        <table class="favorites-table">
            <tbody>
                ${events.map(event => `
                    <tr class="favorite-event-row" data-id="${event.id}">
                        <td class="event-cell">
                            <div class="event-image-small">
                                <img src="${event.image || '/img/logo.jpg'}" 
                                     alt="${event.title}"
                                     onerror="this.src='/img/logo.jpg'">
                            </div>
                            <div class="event-info-small">
                                <div class="event-title-small">${event.title}</div>
                                <div class="event-description-small">
                                    ${event.description ? truncateText(event.description, 60) : 'Описание отсутствует'}
                                </div>
                            </div>
                        </td>
                        <td class="category-cell">
                            <span class="category-badge">${event.category || 'Без категории'}</span>
                        </td>
                        <td class="date-time-cell">
                            <div class="date-time-content">
                                <div class="date-text">${event.formatted_date || 'Дата не указана'}</div>
                                <div class="time-text">
                                    <i class="far fa-clock"></i>
                                    ${event.start_time_formatted || 'Время не указано'}
                                    ${event.end_time_formatted ? `- ${event.end_time_formatted}` : ''}
                                </div>
                            </div>
                        </td>
                        <td class="location-cell">
                            <div class="location-content">
                                <i class="fas fa-map-marker-alt"></i>
                                <span class="location-text" title="${event.location || ''}">
                                    ${event.location ? truncateText(event.location, 30) : 'Место не указано'}
                                </span>
                            </div>
                        </td>
                        <td class="price-cell">
                            <span class="price-badge ${event.price == 0 ? 'free' : ''}">
                                ${event.price == 0 ? 'Бесплатно' : `${event.price} руб.`}
                            </span>
                        </td>
                        <td class="actions-cell">
                            <div class="actions-buttons">
                                <button class="btn-view-event" onclick="viewEvent(${event.id})">
                                    <i class="fas fa-eye"></i>
                                    <span>Смотреть</span>
                                </button>
                                <button class="btn-remove-event" onclick="removeFromFavorites(${event.id}, event)">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    favoritesList.querySelectorAll('.favorite-event-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (!e.target.closest('.actions-buttons')) {
                const eventId = row.getAttribute('data-id');
                if (eventId) {
                    viewEvent(eventId);
                }
            }
        });
    });
}

function displayGridView(events) {
    const favoritesList = document.getElementById('favoritesList');
    
    favoritesList.innerHTML = `
        <div class="favorites-compact-grid">
            ${events.map(event => `
                <div class="compact-event-card" data-id="${event.id}">
                    <div class="compact-event-header">
                        <h3 class="compact-event-title">${event.title}</h3>
                        <button class="compact-remove-btn" 
                                onclick="removeFromFavorites(${event.id}, event)"
                                title="Удалить из избранного">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="compact-event-body">
                        <div class="compact-event-meta">
                            <div class="compact-meta-item">
                                <span class="compact-meta-label">Категория</span>
                                <span class="compact-meta-value">${event.category || 'Без категории'}</span>
                            </div>
                            <div class="compact-meta-item">
                                <span class="compact-meta-label">Дата</span>
                                <span class="compact-meta-value">${event.formatted_date || 'Не указана'}</span>
                            </div>
                            <div class="compact-meta-item">
                                <span class="compact-meta-label">Время</span>
                                <span class="compact-meta-value">
                                    ${event.start_time_formatted || 'Не указано'}
                                    ${event.end_time_formatted ? `- ${event.end_time_formatted}` : ''}
                                </span>
                            </div>
                        </div>
                        <div class="compact-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${event.location ? truncateText(event.location, 30) : 'Место не указано'}
                        </div>
                    </div>
                    <div class="compact-event-footer">
                        <span class="compact-price ${event.price == 0 ? 'free' : ''}">
                            ${event.price == 0 ? 'Бесплатно' : `${event.price} руб.`}
                        </span>
                        <button class="compact-view-btn" onclick="viewEvent(${event.id})">
                            <i class="fas fa-eye"></i>
                            <span>Смотреть</span>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    favoritesList.querySelectorAll('.compact-event-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.compact-remove-btn') && !e.target.closest('.compact-view-btn')) {
                const eventId = card.getAttribute('data-id');
                if (eventId) {
                    viewEvent(eventId);
                }
            }
        });
    });
}

function displayListView(events) {
    const favoritesList = document.getElementById('favoritesList');
    
    favoritesList.innerHTML = `
        <div class="favorites-list-view">
            ${events.map(event => `
                <div class="list-event-item" data-id="${event.id}">
                    <div class="list-event-image">
                        <img src="${event.image || '/img/logo.jpg'}" 
                             alt="${event.title}"
                             onerror="this.src='/img/logo.jpg'">
                    </div>
                    <div class="list-event-info">
                        <h4 class="list-event-title">${event.title}</h4>
                        <span class="list-event-category">${event.category || 'Без категории'}</span>
                    </div>
                    <div class="list-event-date">
                        <i class="far fa-calendar"></i>
                        ${event.formatted_date || 'Дата не указана'}
                    </div>
                    <div class="list-event-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${event.location ? truncateText(event.location, 25) : 'Место не указано'}
                    </div>
                    <span class="list-event-price ${event.price == 0 ? 'free' : ''}">
                        ${event.price == 0 ? 'Бесплатно' : `${event.price} руб.`}
                    </span>
                    <div class="list-event-actions">
                        <button class="list-view-btn" onclick="viewEvent(${event.id})" title="Смотреть">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="list-remove-btn" onclick="removeFromFavorites(${event.id}, event)" title="Удалить">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    favoritesList.querySelectorAll('.list-event-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.list-event-actions')) {
                const eventId = item.getAttribute('data-id');
                if (eventId) {
                    viewEvent(eventId);
                }
            }
        });
    });
}

function viewEvent(eventId) {
    window.location.href = `/html/eventDetails.html?id=${eventId}`;
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength).trim() + '...';
}

async function removeFromFavorites(eventId, e) {
    if (e && e.stopPropagation) {
        e.stopPropagation();
        e.preventDefault();
    }
    
    if (!confirm('Удалить событие из избранного?')) {
        return;
    }
    
    try {
        const response = await fetch('/php/favorites.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_id: eventId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Событие удалено из избранного', 'success');
            
            if (window.currentFavorites) {
                window.currentFavorites = window.currentFavorites.filter(event => event.id != eventId);
                displayFavorites(window.currentFavorites);
            }
            
            if (window.favoritesManager) {
                window.favoritesManager.updateAllStars();
            }
        } else {
            showNotification(data.message || 'Ошибка удаления', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления из избранного:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

async function clearAllFavorites() {
    if (!window.currentFavorites || window.currentFavorites.length === 0) {
        return;
    }
    
    if (!confirm(`Вы уверены, что хотите удалить все избранные события (${window.currentFavorites.length})?`)) {
        return;
    }
    
    try {
        for (const event of window.currentFavorites) {
            await fetch('/php/favorites.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_id: event.id
                })
            });
        }
        
        showNotification('Все избранные события удалены', 'success');
        
        window.currentFavorites = [];
        loadFavorites();
        
        if (window.favoritesManager) {
            window.favoritesManager.updateAllStars();
        }
    } catch (error) {
        console.error('Ошибка очистки избранного:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

function showNotification(message, type = 'info') {
    const oldNotification = document.querySelector('.profile-notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `profile-notification ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
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
    
    const toggleEventFormBtn = document.getElementById('toggleEventFormBtn');
    if (toggleEventFormBtn) {
        toggleEventFormBtn.addEventListener('click', function() {
            const eventFormContainer = document.getElementById('eventFormContainer');
            if (eventFormContainer.style.display === 'none' || eventFormContainer.style.display === '') {
                eventFormContainer.style.display = 'block';
                toggleEventFormBtn.innerHTML = '<i class="fas fa-calendar-minus"></i> Скрыть форму добавления события';
            } else {
                eventFormContainer.style.display = 'none';
                toggleEventFormBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Добавить новое событие';
            }
        });
    }
}

function initEventForm() {
    const addEventForm = document.getElementById('addEventForm');
    if (addEventForm) {
        addEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitEventForm();
        });
    }
}

function submitEventForm() {
    const form = document.getElementById('addEventForm');
    const formData = new FormData(form);
    
    const eventData = {
        title: document.getElementById('eventTitle').value,
        category: document.getElementById('eventCategory').value,
        location: document.getElementById('eventLocation').value,
        price: parseFloat(document.getElementById('eventPrice').value) || 0,
        min_age: document.getElementById('eventMinAge').value,
        description: document.getElementById('eventDescription').value,
        image: document.getElementById('eventImageUrl').value,
        audience: Array.from(document.querySelectorAll('input[name="audience"]:checked'))
            .map(checkbox => checkbox.value).join(', '),
        schedules: []
    };
    
    const dateBlocks = document.querySelectorAll('.date-block');
    dateBlocks.forEach((block, index) => {
        const date = block.querySelector('input[type="date"]').value;
        const startTime = block.querySelector('input[type="time"]:first-of-type').value;
        const endTime = block.querySelector('input[type="time"]:last-of-type').value;
        
        if (date && startTime) {
            const schedule = {
                date: date,
                start_time: startTime,
                end_time: endTime || null
            };
            
            const additionalTimeBlocks = block.querySelectorAll('.additional-time-blocks .time-block');
            additionalTimeBlocks.forEach(timeBlock => {
                const additionalStartTime = timeBlock.querySelector('input[type="time"]:first-of-type').value;
                const additionalEndTime = timeBlock.querySelector('input[type="time"]:last-of-type').value;
                
                if (additionalStartTime) {
                    schedule.additional_times = schedule.additional_times || [];
                    schedule.additional_times.push({
                        start_time: additionalStartTime,
                        end_time: additionalEndTime || null
                    });
                }
            });
            
            eventData.schedules.push(schedule);
        }
    });
    
    if (!eventData.title || !eventData.category || !eventData.location || eventData.schedules.length === 0) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }
    
    fetch('/php/add_event.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Событие успешно добавлено!', 'success');
            form.reset();
            resetEventForm();
        } else {
            showNotification(data.message || 'Ошибка при добавлении события', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    });
}

function resetEventForm() {
    const additionalDatesContainer = document.getElementById('additionalDatesContainer');
    if (additionalDatesContainer) {
        additionalDatesContainer.innerHTML = '';
    }
    
    const additionalTimeBlocks = document.querySelectorAll('.additional-time-blocks');
    additionalTimeBlocks.forEach(block => {
        block.innerHTML = '';
    });
    
    const eventFormContainer = document.getElementById('eventFormContainer');
    if (eventFormContainer) {
        eventFormContainer.style.display = 'none';
    }
    
    const toggleEventFormBtn = document.getElementById('toggleEventFormBtn');
    if (toggleEventFormBtn) {
        toggleEventFormBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Добавить новое событие';
    }
}

window.addDateBlock = function() {
    const container = document.getElementById('additionalDatesContainer');
    const dateCount = container.querySelectorAll('.date-block').length + 2;
    
    const dateBlock = document.createElement('div');
    dateBlock.className = 'date-block';
    dateBlock.id = `dateBlock${dateCount}`;
    dateBlock.innerHTML = `
        <div class="date-header">
            <span class="date-label">Дата проведения *</span>
            <div class="date-header-buttons">
                <button type="button" class="btn-time-add" onclick="addTimeBlock(${dateCount})">
                    <i class="fas fa-plus"></i>
                </button>
                <button type="button" class="btn-remove-date" onclick="removeDateBlock(${dateCount})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="date-time-row">
            <div class="event-form-group date-input-group">
                <input type="date" id="eventDate${dateCount}" class="event-form-input" required>
            </div>
            <div class="event-form-group time-input-group">
                <label for="eventStartTime${dateCount}">Время начала *</label>
                <input type="time" id="eventStartTime${dateCount}" class="event-form-input" required>
            </div>
            <div class="event-form-group time-input-group">
                <label for="eventEndTime${dateCount}">Время окончания</label>
                <input type="time" id="eventEndTime${dateCount}" class="event-form-input">
            </div>
        </div>
        <div id="timeBlocksContainer${dateCount}" class="additional-time-blocks"></div>
    `;
    
    container.appendChild(dateBlock);
    
    const today = new Date().toISOString().split('T')[0];
    dateBlock.querySelector('input[type="date"]').min = today;
};

window.addTimeBlock = function(blockId) {
    const container = document.getElementById(`timeBlocksContainer${blockId}`);
    const timeBlockCount = container.querySelectorAll('.time-block').length + 1;
    
    const timeBlock = document.createElement('div');
    timeBlock.className = 'time-block';
    timeBlock.innerHTML = `
        <div class="time-block-header">
            <span>Дополнительное время ${timeBlockCount}</span>
            <button type="button" class="btn-remove-time-block" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="time-block-fields">
            <div class="event-form-group">
                <label for="eventStartTime${blockId}_${timeBlockCount}">Время начала *</label>
                <input type="time" id="eventStartTime${blockId}_${timeBlockCount}" class="event-form-input" required>
            </div>
            <div class="event-form-group">
                <label for="eventEndTime${blockId}_${timeBlockCount}">Время окончания</label>
                <input type="time" id="eventEndTime${blockId}_${timeBlockCount}" class="event-form-input">
            </div>
        </div>
    `;
    
    container.appendChild(timeBlock);
};

window.removeDateBlock = function(blockId) {
    const block = document.getElementById(`dateBlock${blockId}`);
    if (block) {
        block.remove();
    }
};

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