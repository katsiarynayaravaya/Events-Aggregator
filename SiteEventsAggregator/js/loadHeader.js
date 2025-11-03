async function loadHTML(selector, url) {
    const container = document.querySelector(selector);
    const response = await fetch(url);
    const html = await response.text();
    container.innerHTML = html;
}

async function loadHeader() {
    try {
        await loadHTML('#headerContainer', '/html/header.html');
        await loadHTML('#modalContainer', '/html/modal.html');

        const params = new URLSearchParams(window.location.search);
        const currentCategory = params.get('category');
        if (currentCategory) {
            document.querySelectorAll('.categories a').forEach(link => {
                if (link.dataset.category === currentCategory) {
                    link.classList.add('active-category');
                }
            });
        }

        if (typeof initModal === 'function') {
            initModal();
        }

        setTimeout(() => {
            if (typeof initMobileMenu === 'function') {
                initMobileMenu();
            } else {
                console.error('Функция initMobileMenu не найдена');
            }
        }, 100);
        
    } catch (err) {
        console.error('Ошибка загрузки шапки или модалки:', err);
    }
}

function loadMobileMenuScript() {
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="mobileMenu"]')) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = '/js/mobileMenu.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

loadHeader();
