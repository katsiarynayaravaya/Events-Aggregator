let dateBlockCount = 1;
let timeBlockCounts = {};

document.addEventListener('DOMContentLoaded', function() {
    initEventForm();
});

function initEventForm() {
    const toggleBtn = document.getElementById('toggleEventFormBtn');
    const formContainer = document.getElementById('eventFormContainer');
    
    if (toggleBtn && formContainer) {
        toggleBtn.addEventListener('click', function() {
            if (formContainer.style.display === 'none') {
                showEventForm();
            } else {
                hideEventForm();
            }
        });
    }
    
    const eventForm = document.getElementById('addEventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const errorContainer = document.getElementById('formErrors');
            if (errorContainer) {
                errorContainer.remove();
            }
            
            const formData = collectFormData();
            
            if (!validateEventForm(formData)) {
                return;
            }
            
            const submitBtn = eventForm.querySelector('.btn-submit-event');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('/php/add_event.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showSuccessMessage(result.message);
                    hideEventForm();
                    resetEventForm();
                } else {
                    showServerErrors(result.errors || [result.message]);
                }
                
            } catch (error) {
                console.error('Ошибка сети:', error);
                showServerErrors(['Ошибка сети. Проверьте подключение к интернету']);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('eventDate1').min = today;
    }
    timeBlockCounts[1] = 1;
}

function collectFormData() {
    const formData = {
        title: document.getElementById('eventTitle').value.trim(),
        category: document.getElementById('eventCategory').value,
        location: document.getElementById('eventLocation').value.trim(),
        price: parseFloat(document.getElementById('eventPrice').value) || 0,
        min_age: document.getElementById('eventMinAge').value,
        description: document.getElementById('eventDescription').value.trim(),
        image_url: document.getElementById('eventImageUrl').value.trim(),
        audience: [],
        dates: []
    };
    
    document.querySelectorAll('input[name="audience"]:checked').forEach(cb => {
        formData.audience.push(cb.value);
    });
    
    for (let dateId = 1; dateId <= dateBlockCount; dateId++) {
        const dateBlock = document.getElementById('dateBlock' + dateId);
        if (!dateBlock) continue;
        
        const dateInput = document.getElementById('eventDate' + dateId);
        const startTimeInput = document.getElementById('eventStartTime' + dateId);
        
        if (dateInput && dateInput.value && startTimeInput && startTimeInput.value) {
            const dateItem = {
                date: dateInput.value,
                time_blocks: []
            };
            
            const endTimeInput = document.getElementById('eventEndTime' + dateId);
            const mainTimeBlock = {
                start_time: startTimeInput.value,
                end_time: endTimeInput && endTimeInput.value ? endTimeInput.value : null
            };
            dateItem.time_blocks.push(mainTimeBlock);
            
            const timeBlocksContainer = document.getElementById('timeBlocksContainer' + dateId);
            if (timeBlocksContainer) {
                const timeBlocks = timeBlocksContainer.querySelectorAll('.time-block');
                timeBlocks.forEach((block) => {
                    const addStartTime = block.querySelector('.add-start-time');
                    const addEndTime = block.querySelector('.add-end-time');
                    
                    if (addStartTime && addStartTime.value) {
                        const additionalTimeBlock = {
                            start_time: addStartTime.value,
                            end_time: addEndTime && addEndTime.value ? addEndTime.value : null
                        };
                        dateItem.time_blocks.push(additionalTimeBlock);
                    }
                });
            }
            
            formData.dates.push(dateItem);
        }
    }
    
    return formData;
}

function validateEventForm(formData) {
    const errors = [];
    
    if (!formData.title || formData.title.trim().length < 3) {
        errors.push('Название события должно содержать минимум 3 символа');
        highlightField('eventTitle');
    }
    
    if (!formData.category) {
        errors.push('Выберите категорию');
        highlightField('eventCategory');
    }
    
    if (!formData.location || formData.location.trim().length < 5) {
        errors.push('Место проведения должно содержать минимум 5 символов');
        highlightField('eventLocation');
    }
    
    if (formData.price < 0) {
        errors.push('Цена не может быть отрицательной');
        highlightField('eventPrice');
    }
    
    if (formData.price > 10000) {
        errors.push('Цена не может превышать 10 000 BYN');
        highlightField('eventPrice');
    }
    
    if (formData.dates.length === 0) {
        errors.push('Добавьте хотя бы одну дату проведения');
    }
    
    formData.dates.forEach((dateItem, dateIndex) => {
        const dateObj = new Date(dateItem.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dateObj < today) {
            errors.push(`Дата ${dateIndex + 1} не может быть в прошлом`);
            highlightField(`eventDate${dateIndex + 1}`);
        }
        
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        
        if (dateObj > maxDate) {
            errors.push(`Дата ${dateIndex + 1} не может быть больше чем через год`);
            highlightField(`eventDate${dateIndex + 1}`);
        }
        
        dateItem.time_blocks.forEach((timeBlock, timeIndex) => {
            if (timeBlock.end_time && timeBlock.start_time >= timeBlock.end_time) {
                errors.push(`Время начала должно быть раньше времени окончания (дата ${dateIndex + 1}, блок ${timeIndex + 1})`);
            }
        });
    });
    
    if (formData.image_url && !isValidUrl(formData.image_url)) {
        errors.push('Введите корректный URL изображения (начинается с http:// или https://)');
        highlightField('eventImageUrl');
    }
    
    if (formData.description && formData.description.length > 5000) {
        errors.push('Описание не должно превышать 5000 символов');
        highlightField('eventDescription');
    }
    
    if (errors.length > 0) {
        showValidationErrors(errors);
        return false;
    }
    
    return true;
}

function highlightField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('error-field');
        setTimeout(() => field.classList.remove('error-field'), 3000);
    }
}

function showValidationErrors(errors) {
    let errorContainer = document.getElementById('formErrors');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'formErrors';
        errorContainer.className = 'form-errors';
        const form = document.getElementById('addEventForm');
        form.prepend(errorContainer);
    }
    
    errorContainer.innerHTML = `
        <div class="error-header">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Ошибки в форме:</strong>
        </div>
        <ul class="error-list">
            ${errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
    `;
    
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => errorContainer.remove(), 5000);
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function showSuccessMessage(message) {
    alert(message);
}

function showServerErrors(errors) {
    showValidationErrors(errors.map(err => `Сервер: ${err}`));
}

function showEventForm() {
    const formContainer = document.getElementById('eventFormContainer');
    const toggleBtn = document.getElementById('toggleEventFormBtn');
    
    formContainer.style.display = 'block';
    toggleBtn.innerHTML = '<i class="fas fa-minus-circle"></i> Скрыть форму';
    toggleBtn.classList.add('active');
    
    setTimeout(() => {
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function hideEventForm() {
    const formContainer = document.getElementById('eventFormContainer');
    const toggleBtn = document.getElementById('toggleEventFormBtn');
    
    formContainer.style.display = 'none';
    toggleBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Добавить новое событие';
    toggleBtn.classList.remove('active');
}

window.addTimeBlock = function(dateBlockId) {
    timeBlockCounts[dateBlockId] = (timeBlockCounts[dateBlockId] || 1) + 1;
    const timeBlockNum = timeBlockCounts[dateBlockId];
    
    const timeBlock = document.createElement('div');
    timeBlock.className = 'time-block';
    timeBlock.innerHTML = `
        <div class="time-block-header">
            <span>Дополнительное время ${timeBlockNum}</span>
            <button type="button" class="btn-remove-time-block" onclick="removeTimeBlock(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="time-block-fields">
            <div class="event-form-group">
                <label>Время начала</label>
                <input type="time" class="event-form-input add-start-time" required>
            </div>
            <div class="event-form-group">
                <label>Время окончания</label>
                <input type="time" class="event-form-input add-end-time">
            </div>
        </div>
    `;
    
    const container = document.getElementById('timeBlocksContainer' + dateBlockId);
    container.appendChild(timeBlock);
}

window.removeTimeBlock = function(button) {
    const timeBlock = button.closest('.time-block');
    if (timeBlock) {
        timeBlock.remove();
    }
}

window.addDateBlock = function() {
    dateBlockCount++;
    const blockId = dateBlockCount;
    
    const dateBlock = document.createElement('div');
    dateBlock.className = 'date-block';
    dateBlock.id = 'dateBlock' + blockId;
    dateBlock.innerHTML = `
        <div class="date-header">
            <span class="date-label">Дата ${blockId} *</span>
            <div class="date-header-buttons">
                <button type="button" class="btn-time-add" onclick="addTimeBlock(${blockId})">
                    <i class="fas fa-plus"></i>
                </button>
                <button type="button" class="btn-remove-date" onclick="removeDateBlock(${blockId})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="date-time-row">
            <div class="event-form-group date-input-group">
                <input type="date" id="eventDate${blockId}" class="event-form-input" required>
            </div>
            <div class="event-form-group time-input-group">
                <label for="eventStartTime${blockId}">Время начала *</label>
                <input type="time" id="eventStartTime${blockId}" class="event-form-input" required>
            </div>
            <div class="event-form-group time-input-group">
                <label for="eventEndTime${blockId}">Время окончания</label>
                <input type="time" id="eventEndTime${blockId}" class="event-form-input">
            </div>
        </div>
        <div id="timeBlocksContainer${blockId}" class="additional-time-blocks"></div>
    `;
    
    const container = document.getElementById('additionalDatesContainer');
    container.appendChild(dateBlock);
    
    const today = new Date().toISOString().split('T')[0];
    dateBlock.querySelector('#eventDate' + blockId).min = today;
    
    timeBlockCounts[blockId] = 1;
}

window.removeDateBlock = function(blockId) {
    if (blockId > 1) {
        const block = document.getElementById('dateBlock' + blockId);
        if (block) {
            block.remove();
            delete timeBlockCounts[blockId];
        }
    }
}

function resetEventForm() {
    const form = document.getElementById('addEventForm');
    if (form) {
        form.reset();
        
        const additionalDates = document.getElementById('additionalDatesContainer');
        if (additionalDates) {
            additionalDates.innerHTML = '';
        }
        
        for (const key in timeBlockCounts) {
            const container = document.getElementById('timeBlocksContainer' + key);
            if (container) {
                container.innerHTML = '';
            }
        }
        
        dateBlockCount = 1;
        timeBlockCounts = { 1: 1 };
        
        const today = new Date().toISOString().split('T')[0];
        const firstDate = document.getElementById('eventDate1');
        if (firstDate) {
            firstDate.value = '';
            firstDate.min = today;
        }
        
        const firstTimeBlocksContainer = document.getElementById('timeBlocksContainer1');
        if (firstTimeBlocksContainer) {
            firstTimeBlocksContainer.innerHTML = '';
        }
    }
}