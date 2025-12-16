class FavoritesManager {
    constructor() {
        this.isLoggedIn = false;
        this.userId = null;
        this.eventListeners = new Map();
    }
    
    async init() {
        await this.checkAuthStatus();
        this.initEventHandlers();
        this.setupAuthListener();
    }
    
    async checkAuthStatus() {
        try {
            const response = await fetch('/php/check_authorization.php');
            const text = await response.text();
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                if (text.includes('"logged_in":true')) {
                    data = { logged_in: true };
                } else {
                    data = { logged_in: false };
                }
            }
            
            const wasLoggedIn = this.isLoggedIn;
            this.isLoggedIn = data.logged_in;
            if (this.isLoggedIn) {
                this.userId = data.user_id;
            } else {
                this.userId = null;
            }
            
            console.log('Статус авторизации:', this.isLoggedIn ? 'Авторизован' : 'Не авторизован');
            
            if (wasLoggedIn !== this.isLoggedIn) {
                console.log('Статус авторизации изменился, обновляем звезды');
                await this.updateAllStars();
                await this.syncFavorites();
            }
            
            return this.isLoggedIn;
            
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            this.isLoggedIn = false;
            this.userId = null;
            return false;
        }
    }
    
    setupAuthListener() {
        window.addEventListener('focus', async () => {
            console.log('Окно получило фокус, проверяем авторизацию');
            await this.checkAuthStatus();
        });
        
        setInterval(async () => {
            await this.checkAuthStatus();
        }, 60000);
    }
    
    async checkFavorite(eventId) {
        if (!this.isLoggedIn) return false;
        
        try {
            const response = await fetch(`/php/favorites.php?check=true&event_id=${eventId}`);
            const text = await response.text();
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Ошибка парсинга JSON:', text);
                return false;
            }
            
            return data.success && data.logged_in && data.is_favorite;
        } catch (error) {
            console.error('Ошибка проверки избранного:', error);
            return false;
        }
    }
    
    async toggle(eventId, button) {
        console.log('Нажатие на звезду, eventId:', eventId, 'button:', button);
        
        if (!this.isLoggedIn) {
            this.showNotification('Для добавления в избранное необходимо войти в личный кабинет');
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
            
            const text = await response.text();
            let data;
            
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Ошибка парсинга JSON:', text);
                this.showNotification('Ошибка сервера');
                return;
            }
            
            if (data.success) {
                await this.updateStar(button, eventId);
                await this.updateAllStars();
                await this.syncFavorites();
                this.showNotification(data.message);
            } else {
                this.showNotification(data.message || 'Ошибка сервера');
            }
            
        } catch (error) {
            console.error('Ошибка переключения избранного:', error);
            this.showNotification('Ошибка соединения с сервером');
        }
    }
    
    async updateStar(button, eventId) {
        const icon = button.querySelector('i');
        
        if (!this.isLoggedIn) {
            icon.classList.remove('fas');
            icon.classList.add('far');
            button.classList.remove('active');
            button.style.color = '#8C8577';
            button.setAttribute('title', 'Добавить в избранное (требуется вход)');
            return;
        }
        
        try {
            const isFavorite = await this.checkFavorite(eventId);
            
            if (isFavorite) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                button.classList.add('active');
                button.style.color = '#004643';
                button.setAttribute('title', 'Удалить из избранного');
                console.log('Звезда обновлена: заполнена для события', eventId);
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                button.classList.remove('active');
                button.style.color = '#8C8577';
                button.setAttribute('title', 'Добавить в избранное');
                console.log('Звезда обновлена: пустая для события', eventId);
            }
        } catch (error) {
            console.error('Ошибка обновления звезды:', error);
        }
    }
    
    initEventHandlers() {
        console.log('Инициализация обработчиков событий для избранного');
        
        document.addEventListener('click', async (e) => {
            const listButton = e.target.closest('.favorite-btn-list');
            if (listButton) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Клик на звезду в списке событий');
                const eventId = listButton.getAttribute('data-id');
                console.log('Event ID из data-id:', eventId);
                
                if (eventId) {
                    await this.toggle(eventId, listButton);
                }
                return;
            }
            
            const detailButton = e.target.closest('#favoriteBtn');
            if (detailButton) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Клик на звезду на детальной странице');
                const urlParams = new URLSearchParams(window.location.search);
                const eventId = urlParams.get('id');
                
                if (eventId) {
                    await this.toggle(eventId, detailButton);
                }
                return;
            }
        });
        
        this.updateAllStars();
    }
    
    async updateAllStars() {
        console.log('Обновление всех звезд на странице');
        
        const listButtons = document.querySelectorAll('.favorite-btn-list');
        console.log('Найдено звезд в списках:', listButtons.length);
        
        for (const btn of listButtons) {
            const eventId = btn.getAttribute('data-id');
            console.log('Обновление звезды с eventId:', eventId);
            if (eventId) {
                await this.updateStar(btn, eventId);
            }
        }
        
        const detailBtn = document.getElementById('favoriteBtn');
        if (detailBtn) {
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get('id');
            if (eventId) {
                console.log('Обновление звезды на детальной странице, eventId:', eventId);
                await this.updateStar(detailBtn, eventId);
            }
        }
    }
    
    async refreshStars() {
        console.log('Принудительное обновление звезд');
        await this.checkAuthStatus();
        await this.updateAllStars();
    }
    
    async syncFavorites() {
        console.log('Синхронизация избранного в профиле');
        if (window.location.pathname.includes('profile.html') && typeof loadFavorites === 'function') {
            console.log('Обновление списка избранного в профиле');
            loadFavorites();
        }
    }
    
    showNotification(message) {
        const oldNotification = document.querySelector('.favorite-notification');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'favorite-notification';
        notification.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #004643;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

window.favoritesManager = new FavoritesManager();

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализируем FavoritesManager');
    window.favoritesManager.init();
});

window.refreshFavoriteStars = function() {
    if (window.favoritesManager) {
        window.favoritesManager.refreshStars();
    }
};

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