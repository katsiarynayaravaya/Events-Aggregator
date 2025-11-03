class MobileMenu {
    constructor() {
        this.menuToggle = null;
        this.categoriesNav = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupMenu());
        } else {
            this.setupMenu();
        }
    }

    setupMenu() {
        this.menuToggle = document.querySelector('.mobile-menu-toggle');
        this.categoriesNav = document.querySelector('.categories');
        
        if (this.menuToggle && this.categoriesNav) {
            console.log('Мобильное меню инициализировано');
            this.setupEventListeners();
            this.setupAccessibility();
            
            if (window.innerWidth <= 992) {
                this.closeMenu();
            }
        } else {
            console.error('Элементы мобильного меню не найдены');
            setTimeout(() => {
                this.setupMenu();
            }, 100);
        }
    }

    setupEventListeners() {
        this.menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        this.categoriesNav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && window.innerWidth <= 992) {
                this.closeMenu();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                this.closeMenu();
            }
        });

        document.addEventListener('click', (e) => {
            if (this.isOpen && 
                !this.categoriesNav.contains(e.target) && 
                !this.menuToggle.contains(e.target)) {
                this.closeMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
                this.menuToggle.focus();
            }
        });
    }

    setupAccessibility() {
        this.menuToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleMenu();
            }
        });
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.categoriesNav.classList.add('mobile-open');
        this.menuToggle.setAttribute('aria-expanded', 'true');
        this.isOpen = true;
        console.log('Меню открыто');
    }

    closeMenu() {
        this.categoriesNav.classList.remove('mobile-open');
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.isOpen = false;
        console.log('Меню закрыто');
    }
}

let mobileMenu;

function initMobileMenu() {
    mobileMenu = new MobileMenu();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
    initMobileMenu();
}

window.initMobileMenu = initMobileMenu;