document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (!eventId) {
        window.location.href = '/html/mainPage.html';
        return;
    }
    
    loadEventDetails(eventId);
    
    // Убираем кнопки покупки билетов и поделиться
    const buyTicketBtn = document.getElementById('buyTicketBtn');
    const shareBtn = document.getElementById('shareBtn');
    
    if (buyTicketBtn) {
        buyTicketBtn.style.display = 'none';
    }
    
    if (shareBtn) {
        shareBtn.style.display = 'none';
    }
});

async function loadEventDetails(eventId) {
    try {
        const response = await fetch(`/php/events_list.php?id=${eventId}`);
        const data = await response.json();
        
        if (data.success && data.event) {
            displayEventDetails(data.event);
           
            if (data.event.category) {
                loadSimilarEvents(eventId, data.event.category);
            }
        } else {
            showError();
        }
    } catch (error) {
        console.error('Ошибка загрузки деталей события:', error);
        showError();
    }
}

function displayEventDetails(event) {
    // Устанавливаем заголовок страницы
    document.title = `${event.title} - Агрегатор событий`;
    
    // Заполняем основные данные
    document.getElementById('eventTitle').textContent = event.title;
    document.getElementById('eventCategory').textContent = event.category || 'Не указана';
    document.getElementById('eventDescription').innerHTML = 
        `<p>${event.description || 'Описание отсутствует'}</p>`;
    
    // Устанавливаем изображение
    const eventImage = document.getElementById('eventImage');
    eventImage.src = event.image || '/img/logo.jpg';
    eventImage.alt = event.title;
    eventImage.onerror = function() {
        this.src = '/img/logo.jpg';
    };
    
    // Заполняем мета-данные
    document.getElementById('eventDate').textContent = 
        event.formatted_date || formatDate(event.date);
    
    document.getElementById('eventTime').textContent = 
        `${event.formatted_time || event.start_time_formatted || 'Не указано'}${event.end_time_formatted ? ` - ${event.end_time_formatted}` : ''}`;
    
    document.getElementById('eventLocation').textContent = 
        event.location || 'Не указано';
    
    document.getElementById('eventPrice').textContent = 
        getPriceDisplay(event);
    
    document.getElementById('eventAudience').textContent = 
        event.audience || 'Для всех';
    
    document.getElementById('eventAge').textContent = 
        event.min_age ? `${event.min_age}` : '0+';
    
    // Показываем длительность если есть
    if (event.duration_minutes) {
        const durationText = formatDuration(event.duration_minutes);
        
        const timeElement = document.getElementById('eventTime');
        if (timeElement) {
            timeElement.innerHTML += ` <span style="color: #666; font-size: 0.9em;">(${durationText})</span>`;
        }
    }
}

function getPriceDisplay(event) {
    if (event.price === 0 || event.price === '0') {
        return 'Бесплатно';
    } else if (event.price > 0) {
        return `${event.price} руб.`;
    }
    return 'Цена не указана';
}

function formatDate(dateString) {
    if (!dateString) return 'Дата не указана';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
        return `${mins} мин`;
    } else if (mins === 0) {
        return `${hours} ч`;
    } else {
        return `${hours} ч ${mins} мин`;
    }
}

async function loadSimilarEvents(eventId, category) {
    try {
        const response = await fetch(`/php/events_list.php?cat=${encodeURIComponent(category)}&limit=4&exclude=${eventId}`);
        const data = await response.json();
        
        if (data.success && data.events && data.events.length > 0) {
            displaySimilarEvents(data.events);
        } else {
            document.getElementById('similarEvents').innerHTML = `
                <div class="no-events" style="padding: 20px; margin: 20px 0;">
                    <p>Похожих событий не найдено</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Ошибка загрузки похожих событий:', error);
        document.getElementById('similarEvents').innerHTML = `
            <div class="no-events" style="padding: 20px; margin: 20px 0;">
                <p>Не удалось загрузить похожие события</p>
            </div>
        `;
    }
}

function displaySimilarEvents(events) {
    const container = document.getElementById('similarEvents');
    
    container.innerHTML = events.map(event => `
        <div class="event-card-similar" data-id="${event.id}">
            <div class="event-image-similar">
                <img src="${event.image || '/img/logo.jpg'}" alt="${event.title}">
            </div>
            <div class="event-info-similar">
                <h4>${event.title}</h4>
                <div class="event-meta-similar">
                    <span><i class="far fa-calendar"></i> ${formatDateShort(event.date)}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${event.location ? (event.location.length > 20 ? event.location.substring(0, 20) + '...' : event.location) : ''}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Добавляем CSS стили если их нет
    if (!document.querySelector('#similar-events-style')) {
        const style = document.createElement('style');
        style.id = 'similar-events-style';
        style.textContent = `
            .similar-events-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .event-card-similar {
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .event-card-similar:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .event-image-similar {
                height: 120px;
                overflow: hidden;
            }
            
            .event-image-similar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s ease;
            }
            
            .event-card-similar:hover .event-image-similar img {
                transform: scale(1.05);
            }
            
            .event-info-similar {
                padding: 12px;
            }
            
            .event-info-similar h4 {
                margin: 0 0 8px 0;
                font-size: 0.95rem;
                color: #2A1A1F;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                height: 2.4em;
                line-height: 1.2em;
            }
            
            .event-meta-similar {
                display: flex;
                flex-direction: column;
                gap: 4px;
                font-size: 0.8rem;
                color: #666;
            }
            
            .event-meta-similar i {
                margin-right: 5px;
                color: #004643;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Добавляем обработчики кликов
    document.querySelectorAll('.event-card-similar').forEach(card => {
        card.addEventListener('click', () => {
            const eventId = card.getAttribute('data-id');
            if (eventId) {
                window.location.href = `/html/eventDetails.html?id=${eventId}`;
            }
        });
    });
}

function formatDateShort(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
        });
    } catch (e) {
        return '';
    }
}

function showError() {
    const container = document.querySelector('.event-details-container');
    if (container) {
        container.innerHTML = `
            <div class="no-events" style="width: 100%; padding: 40px; text-align: center;">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Событие не найдено</h3>
                <p>Извините, запрашиваемое событие не существует или было удалено.</p>
                <a href="/html/mainPage.html" style="margin-top: 20px; display: inline-block; padding: 10px 20px; background: #004643; color: white; text-decoration: none; border-radius: 4px;">
                    Вернуться на главную
                </a>
            </div>
        `;
    }
}
