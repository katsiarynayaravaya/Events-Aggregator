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
    // Сохраняем событие для возможного использования
    window.currentEvent = event;
    
    // Устанавливаем заголовок страницы
    document.title = `${event.title} - Агрегатор событий`;
    
    // Заполняем основные данные
    document.getElementById('eventTitle').textContent = event.title;
    document.getElementById('eventCategory').textContent = event.category || 'Не указана';
    
    // Описание с сохранением переносов строк
    const description = event.description || 'Описание отсутствует';
    const formattedDescription = description.replace(/\n/g, '<br>');
    document.getElementById('eventDescription').innerHTML = `<p>${formattedDescription}</p>`;
    
    // Устанавливаем изображение
    const eventImage = document.getElementById('eventImage');
    eventImage.src = event.image || '/img/logo.jpg';
    eventImage.alt = event.title;
    eventImage.onerror = function() {
        this.src = '/img/logo.jpg';
    };
    
    // ПОЛНАЯ ИНФОРМАЦИЯ О ДАТЕ
    // Если есть несколько дат, показываем диапазон
    if (event.all_dates) {
        const dates = event.all_dates.split('|').filter(d => d.trim() !== '');
        if (dates.length > 1) {
            // Показываем диапазон дат
            const firstDate = formatDateFull(dates[0]);
            const lastDate = formatDateFull(dates[dates.length - 1]);
            document.getElementById('eventDate').textContent = `${firstDate} - ${lastDate}`;
        } else if (dates.length === 1) {
            // Показываем одну дату
            document.getElementById('eventDate').textContent = formatDateFull(dates[0]);
        }
    } else if (event.date) {
        // Или используем основную дату
        document.getElementById('eventDate').textContent = formatDateFull(event.date);
    } else {
        document.getElementById('eventDate').textContent = 'Дата не указана';
    }
    
    // ВРЕМЕННЫЕ СЕАНСЫ - показываем все сразу
    let timeDisplay = '';
    
    if (event.formatted_time_slots && Array.isArray(event.formatted_time_slots) && event.formatted_time_slots.length > 0) {
        // Группируем сеансы по датам для красивого отображения
        const timeSlotsByDate = {};
        event.formatted_time_slots.forEach(slot => {
            if (!timeSlotsByDate[slot.date]) {
                timeSlotsByDate[slot.date] = [];
            }
            timeSlotsByDate[slot.date].push(slot.display);
        });
        
        // Создаем красивый блок с сеансами
        const dates = Object.keys(timeSlotsByDate).sort();
        
        if (dates.length === 1) {
            // Если только одна дата, показываем все сеансы в одной строке
            const slots = timeSlotsByDate[dates[0]];
            timeDisplay = slots.join(', ');
        } else {
            // Если несколько дат, создаем компактный блок только с временами
            timeDisplay = createTimeSlotsDisplay(timeSlotsByDate);
        }
    } else if (event.start_time) {
        // Или используем время из основных полей
        timeDisplay = formatTime(event.start_time);
        if (event.end_time && event.end_time !== event.start_time) {
            timeDisplay += ` - ${formatTime(event.end_time)}`;
        }
    } else {
        timeDisplay = 'Время не указано';
    }
    
    document.getElementById('eventTime').innerHTML = timeDisplay;
    
    // Остальные поля
    document.getElementById('eventLocation').textContent = event.location || 'Место не указано';
    document.getElementById('eventPrice').textContent = getPriceDisplay(event);
    document.getElementById('eventAudience').textContent = event.audience || 'Для всех';
    
    // ВОЗРАСТ - выводим как есть из БД
    document.getElementById('eventAge').textContent = event.min_age || '0+';
}

function createTimeSlotsDisplay(timeSlotsByDate) {
    const dates = Object.keys(timeSlotsByDate).sort();
    
    // Собираем ВСЕ временные сеансы без дат
    const allTimeSlots = [];
    dates.forEach(date => {
        allTimeSlots.push(...timeSlotsByDate[date]);
    });
    
    // Убираем дубликаты времени
    const uniqueTimeSlots = [...new Set(allTimeSlots)];
    
    // Если много уникальных временных слотов, показываем компактно
    if (uniqueTimeSlots.length > 3) {
        return `
            <div style="color: #004643;">
                <div style="margin-bottom: 5px;">
                    <i class="far fa-clock"></i> 
                    <strong>Доступно ${uniqueTimeSlots.length} сеансов</strong>
                </div>
                <div style="font-size: 0.95em; color: #666;">
                    ${uniqueTimeSlots.slice(0, 3).join(', ')} и другие...
                </div>
            </div>
        `;
    }
    
    // Если немного временных слотов, показываем все
    return uniqueTimeSlots.join(', ');
}

function formatTime(timeStr) {
    if (!timeStr || timeStr.trim() === '') return '';
    
    // Если время уже в формате HH:MM
    if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
        return timeStr;
    }
    
    // Если время в формате HH:MM:SS
    if (timeStr.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
        return timeStr.substring(0, 5);
    }
    
    // Если только часы (например "17")
    if (timeStr.match(/^\d{1,2}$/)) {
        const hours = parseInt(timeStr);
        return `${hours.toString().padStart(2, '0')}:00`;
    }
    
    return timeStr;
}

function formatDateFull(dateString) {
    if (!dateString) return '';
    
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

function formatDateShort(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
        });
    } catch (e) {
        return dateString;
    }
}

function getPriceDisplay(event) {
    if (event.price === 0 || event.price === '0') {
        return 'Бесплатно';
    } else if (event.price > 0) {
        return `${event.price} руб.`;
    } else if (event.price === -1) {
        return 'Добровольный взнос';
    }
    return 'Цена не указана';
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