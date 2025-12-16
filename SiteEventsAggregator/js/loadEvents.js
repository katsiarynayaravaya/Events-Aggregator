class EventManager {
    constructor() {
        this.useMockData = false;
    }
    
    loadMainPageEvents() {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        this.loadEventsFromAPI(`/php/events_list.php?date_from=${today}&date_to=${nextWeek}`, 'Главная');
    }
    
    loadDateEvents(day, month, year) {
        const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        this.loadEventsFromAPI(`/php/events_list.php?date=${date}`, 'date');
    }
    
    loadCategoryEvents(category) {
        this.loadEventsFromAPI(`/php/events_list.php?cat=${encodeURIComponent(category)}`, 'category');
    }
    
    loadSearchEvents(query) {
        this.loadEventsFromAPI(`/php/events_list.php?q=${encodeURIComponent(query)}`, 'search');
    }
    
    loadFilterEvents(filters) {
        const params = new URLSearchParams(filters).toString();
        this.loadEventsFromAPI(`/php/events_list.php?${params}`, 'filters');
    }
    
    async loadEventsFromAPI(url, context = '') {
        const container = this.getEventsContainer();
        if (!container) {
            console.warn('Контейнер для событий не найден');
            return;
        }
        
        this.showLoading(container);
        
        try {
            console.log('Загружаем события из:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const text = await response.text();
            
            if (!response.ok) {
                throw new Error(`HTTP ошибка ${response.status}: ${response.statusText}`);
            }
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Невалидный JSON ответ');
                console.error('Полный ответ:', text);
                throw new Error('Сервер вернул невалидный JSON. Возможно ошибка в PHP скрипте.');
            }
            
            console.log('Данные получены:', data);
            
            if (data.success && data.events && Array.isArray(data.events)) {
                if (data.events.length > 0) {
                    this.renderEvents(data.events, container);
                } else {
                    this.showNoEvents(container, context);
                }
            } else {
                this.showNoEvents(container, context);
                console.warn('Нет событий или ошибка в данных:', data);
            }
        } catch (error) {
            console.error('Ошибка загрузки событий:', error);
            this.showError(container, error.message);
        }
    }
    
    getEventsContainer() {
        document.querySelectorAll('.placeholder').forEach(el => {
            el.style.display = 'none';
        });
        
        const selectors = [
            '.events-section',
            '.search-results',
            '#searchResultsContent',
            '.events-wrapper-main',
            '.events-wrapper > section'
        ];
        
        for (const selector of selectors) {
            const container = document.querySelector(selector);
            if (container) {
                return container;
            }
        }
        
        return null;
    }
    
    showLoading(container) {
        container.innerHTML = `
            <div class="loading-events">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Загрузка событий...</h3>
                <p>Пожалуйста, подождите</p>
            </div>
        `;
    }
    
    showError(container, errorMessage = '') {
        container.innerHTML = `
            <div class="no-events">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки</h3>
                <p>Не удалось загрузить события с сервера.</p>
                ${errorMessage ? `<p><small>${errorMessage}</small></p>` : ''}
                <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #004643; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-redo"></i> Попробовать снова
                </button>
            </div>
        `;
    }
    
    showNoEvents(container, context = '') {
        let message = 'События не найдены';
        let subMessage = 'Попробуйте изменить параметры поиска';
        
        switch(context) {
            case 'date':
                message = 'Событий на выбранную дату нет';
                subMessage = 'Выберите другую дату в календаре';
                break;
            case 'category':
                message = 'Событий в этой категории нет';
                subMessage = 'Попробуйте другую категорию';
                break;
            case 'search':
                message = 'По вашему запросу ничего не найдено';
                subMessage = 'Попробуйте изменить поисковый запрос';
                break;
            case 'filters':
                message = 'По выбранным фильтрам событий нет';
                subMessage = 'Попробуйте изменить параметры фильтров';
                break;
            case 'Главная':
                message = 'На этой неделе событий нет';
                subMessage = 'Загляните позже или посмотрите другие даты';
                break;
        }
        
        container.innerHTML = `
            <div class="no-events">
                <i class="far fa-calendar-times"></i>
                <h3>${message}</h3>
                <p>${subMessage}</p>
            </div>
        `;
    }
    
    renderEvents(events, container) {
        container.innerHTML = this.createListHTML(events);
        
        this.addEventClickHandlers();
        
        if (window.favoritesManager) {
            setTimeout(() => {
                window.favoritesManager.updateAllStars();
            }, 100);
        }
    }
    
    createListHTML(events) {
        return `
            <div class="events-list">
                ${events.map(event => `
                    <div class="event-card-list" data-id="${event.id}">
                        <div class="event-image-list">
                            <img src="${event.image || '/img/logo.jpg'}" 
                                 alt="${event.title}"
                                 onerror="this.src='/img/logo.jpg'">
                        </div>
                        <div class="event-content-list">
                            <div class="event-favorite-list">
                                <button class="favorite-btn-list" 
                                        data-id="${event.id}"
                                        title="Добавить в избранное">
                                    <i class="far fa-star"></i>
                                </button>
                            </div>
                            <h3 class="event-title-list">${event.title}</h3>
                            <p class="event-description-list">
                                ${event.description ? this.truncateText(event.description, 150) : 'Описание отсутствует'}
                            </p>
                            <div class="event-meta-list">
                                <div class="event-meta-item category">
                                    ${event.category || 'Не указано'}
                                </div>
                                <div class="event-meta-item">
                                    <i class="far fa-calendar"></i>
                                    ${this.formatDate(event.date)}
                                </div>
                                <div class="event-meta-item">
                                    <i class="far fa-clock"></i>
                                    ${event.start_time ? event.start_time.substring(0, 5) : 'Время не указано'}
                                </div>
                                <div class="event-meta-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    ${event.location || 'Место не указано'}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    formatDate(dateString) {
        if (!dateString) return 'Дата не указана';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength).trim() + '...';
    }
    
    addEventClickHandlers() {
        document.querySelectorAll('.event-card-list').forEach(card => {
            card.addEventListener('click', (e) => {
                const eventId = card.getAttribute('data-id');
                if (eventId && !e.target.closest('.favorite-btn-list')) {
                    window.location.href = `/html/eventDetails.html?id=${eventId}`;
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .favorite-notification {
            animation: slideInRight 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    document.querySelectorAll('.placeholder').forEach(el => {
        el.style.display = 'none';
    });
    
    window.eventManager = new EventManager();
    
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    console.log('Текущая страница:', path);
    console.log('Параметры URL:', Object.fromEntries(searchParams.entries()));
    
    if (path.includes('mainPage.html') || path === '/' || path === '/index.html') {
        console.log('Загружаем события для главной страницы');
        window.eventManager.loadMainPageEvents();
        
    } else if (path.includes('eventDatePage.html')) {
        const day = searchParams.get('day');
        const month = searchParams.get('month');
        const year = searchParams.get('year');
        
        if (day && month && year) {
            console.log('Загружаем события для даты:', day, month, year);
            window.eventManager.loadDateEvents(day, month, year);
        } else {
            window.eventManager.showNoEvents(window.eventManager.getEventsContainer(), 'date');
        }
        
    } else if (path.includes('searchResults.html')) {
        const hasFilters = searchParams.has('time_of_day') || 
                          searchParams.has('duration_type') || 
                          searchParams.has('price_type') || 
                          searchParams.has('min_age') || 
                          searchParams.has('audience');
        
        if (hasFilters) {
            console.log('Загружаем события с фильтрами:', Object.fromEntries(searchParams.entries()));
            window.eventManager.loadFilterEvents(searchParams.toString());
        } else {
            const query = searchParams.get('q');
            if (query) {
                console.log('Загружаем события поиска по запросу:', query);
                window.eventManager.loadSearchEvents(query);
            } else {
                window.eventManager.showNoEvents(window.eventManager.getEventsContainer(), 'search');
            }
        }
        
    } else if (path.includes('category.html')) {
        const category = searchParams.get('cat');
        if (category) {
            console.log('Загружаем события категории:', category);
            window.eventManager.loadCategoryEvents(category);
        } else {
            window.eventManager.showNoEvents(window.eventManager.getEventsContainer(), 'category');
        }
    }
    
    window.addEventListener('popstate', () => {
        console.log('Навигация popstate (назад/вперед), проверяем авторизацию и звезды');
        if (window.favoritesManager) {
            setTimeout(() => {
                window.favoritesManager.refreshStars();
            }, 300);
        }
    });
    
    document.addEventListener('click', (e) => {
        const backLink = e.target.closest('.back-link a') || 
                        (e.target.closest('a') && 
                         (e.target.closest('a').getAttribute('href') === 'javascript:history.back()' ||
                          e.target.closest('a').getAttribute('href') === '#'));
        
        if (backLink && window.favoritesManager) {
            console.log('Клик на ссылку "назад", обновляем звезды');
            setTimeout(() => {
                window.favoritesManager.refreshStars();
            }, 500);
        }
    });
    
    window.addEventListener('eventsLoaded', () => {
        console.log('События загружены, обновляем звезды');
        if (window.favoritesManager) {
            setTimeout(() => {
                window.favoritesManager.updateAllStars();
            }, 200);
        }
    });
    
    setTimeout(() => {
        window.dispatchEvent(new Event('eventsLoaded'));
    }, 1000);
});