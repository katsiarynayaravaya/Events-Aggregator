document.addEventListener('DOMContentLoaded', () => {
    const filterBlocks = document.querySelectorAll('.filter-block');
    const expandAllBtn = document.getElementById('expandAll');
    const collapseAllBtn = document.getElementById('collapseAll');
    const resetAllBtn = document.getElementById('resetAll');
    const searchButton = document.querySelector('.search-button');

    const timeOfDayMap = {
        'Утренние (до 12:00)': 'morning',
        'Дневные (12:00 - 18:00)': 'day',
        'Вечерние (после 18:00)': 'evening',
        'Ночные (после 23:00)': 'night'
    };

    const durationMap = {
        'Короткие (до 1 часа)': 'short',
        'Средние (1-3 часа)': 'medium',
        'Длинные (более 3 часов)': 'long',
        'На целый день': 'all_day'
    };

    const priceMap = {
        'Бесплатные': 'free',
        'Платные': 'paid',
        'По желанию (плати сколько хочешь)': 'donation'
    };

    const audienceMap = {
        'Семьей': 'Семьей',
        'С друзьями': 'С друзьями',
        'Со второй половинкой': 'Со второй половинкой',
        'Одному': 'Одному',
        'Большой компанией': 'Большой компанией'
    };

    filterBlocks.forEach(block => {
        const header = block.querySelector('.filter-header');
        const resetLink = block.querySelector('.reset-link');
        const checkboxes = block.querySelectorAll('input[type="checkbox"]');

        header.addEventListener('click', (e) => {
            if (e.target.classList.contains('reset-link')) return;
            block.classList.toggle('active');
            updateGlobalButtons();
        });

        resetLink.addEventListener('click', (e) => {
            e.stopPropagation();
            checkboxes.forEach(ch => ch.checked = false);
            resetLink.style.display = 'none';
        });

        checkboxes.forEach(ch => {
            ch.addEventListener('change', () => {
                const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
                resetLink.style.display = anyChecked ? 'inline' : 'none';
            });
        });
    });

    expandAllBtn.addEventListener('click', () => {
        filterBlocks.forEach(b => b.classList.add('active'));
        updateGlobalButtons();
    });

    collapseAllBtn.addEventListener('click', () => {
        filterBlocks.forEach(b => b.classList.remove('active'));
        updateGlobalButtons();
    });

    resetAllBtn.addEventListener('click', () => {
        filterBlocks.forEach(block => {
            const resetLink = block.querySelector('.reset-link');
            const checkboxes = block.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(ch => ch.checked = false);
            resetLink.style.display = 'none';
        });
    });

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            const currentQuery = params.get('q') || '';
            
            const filters = collectFilters();
            
            const queryString = buildQueryString(currentQuery, filters);
            
            window.location.href = `/html/searchResults.html?${queryString}`;
        });
    }

    function updateGlobalButtons() {
        const allExpanded = Array.from(filterBlocks).every(b => b.classList.contains('active'));
        const allCollapsed = Array.from(filterBlocks).every(b => !b.classList.contains('active'));

        if (allExpanded) {
            expandAllBtn.style.display = 'none';
            collapseAllBtn.style.display = 'inline';
        } else if (allCollapsed) {
            collapseAllBtn.style.display = 'none';
            expandAllBtn.style.display = 'inline';
        } else {
            expandAllBtn.style.display = 'inline';
            collapseAllBtn.style.display = 'inline';
        }
    }

    function collectFilters() {
        const filters = {
            time_of_day: [],
            duration_type: [],
            price_type: null,
            min_age: [],
            audience: []
        };

        const timeCheckboxes = document.querySelectorAll('.filter-block:nth-child(1) .subsection:nth-child(1) input[type="checkbox"]');
        timeCheckboxes.forEach((cb, index) => {
            if (cb.checked) {
                const labels = [
                    'Утренние (до 12:00)',
                    'Дневные (12:00 - 18:00)',
                    'Вечерние (после 18:00)',
                    'Ночные (после 23:00)'
                ];
                if (labels[index]) {
                    filters.time_of_day.push(timeOfDayMap[labels[index]]);
                }
            }
        });

        const durationCheckboxes = document.querySelectorAll('.filter-block:nth-child(1) .subsection:nth-child(2) input[type="checkbox"]');
        durationCheckboxes.forEach((cb, index) => {
            if (cb.checked) {
                const labels = [
                    'Короткие (до 1 часа)',
                    'Средние (1-3 часа)',
                    'Длинные (более 3 часов)',
                    'На целый день'
                ];
                if (labels[index]) {
                    filters.duration_type.push(durationMap[labels[index]]);
                }
            }
        });

        const priceCheckboxes = document.querySelectorAll('.filter-block:nth-child(2) input[type="checkbox"]');
        priceCheckboxes.forEach((cb, index) => {
            if (cb.checked) {
                const labels = [
                    'Бесплатные',
                    'Платные',
                    'По желанию (плати сколько хочешь)'
                ];
                if (labels[index]) {
                    if (!filters.price_type) {
                        filters.price_type = priceMap[labels[index]];
                    }
                }
            }
        });

        const ageCheckboxes = document.querySelectorAll('.filter-block:nth-child(3) input[type="checkbox"]');
        ageCheckboxes.forEach((cb, index) => {
            if (cb.checked) {
                const labels = ['0+', '6+', '12+', '16+', '18+'];
                if (labels[index]) {
                    filters.min_age.push(labels[index]);
                }
            }
        });

        const audienceCheckboxes = document.querySelectorAll('.filter-block:nth-child(4) input[type="checkbox"]');
        audienceCheckboxes.forEach((cb, index) => {
            if (cb.checked) {
                const labels = [
                    'Семьей',
                    'С друзьями',
                    'Со второй половинкой',
                    'Одному',
                    'Большой компанией'
                ];
                if (labels[index]) {
                    filters.audience.push(audienceMap[labels[index]]);
                }
            }
        });

        return filters;
    }

    function buildQueryString(searchQuery, filters) {
        const params = new URLSearchParams();
        
        if (searchQuery) {
            params.append('q', searchQuery);
        }
        
        if (filters.time_of_day.length > 0) {
            params.append('time_of_day', filters.time_of_day.join(','));
        }
        
        if (filters.duration_type.length > 0) {
            params.append('duration_type', filters.duration_type.join(','));
        }
        
        if (filters.price_type) {
            params.append('price_type', filters.price_type);
        }
        
        if (filters.min_age.length > 0) {
            const ageOrder = ['0+', '6+', '12+', '16+', '18+'];
            const minAge = filters.min_age.reduce((min, age) => {
                return ageOrder.indexOf(age) < ageOrder.indexOf(min) ? age : min;
            }, '18+');
            params.append('min_age', minAge);
        }
        
        if (filters.audience.length > 0) {
            params.append('audience', filters.audience[0]); 
        }
        
        return params.toString();
    }

    updateGlobalButtons();
});