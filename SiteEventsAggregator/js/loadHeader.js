async function loadHTML(selector, url) {
    const container = document.querySelector(selector);
    const response = await fetch(url);
    const html = await response.text();
    container.innerHTML = html;
}

async function loadHeader() {
    try {
        await loadHTML('#headerContainer', 'header.html');
        await loadHTML('#modalContainer', 'modal.html');

        const params = new URLSearchParams(window.location.search);
        const currentCat = params.get('cat');
        if (currentCat) {
            document.querySelectorAll('.categories a').forEach(link => {
                if (link.textContent === currentCat) {
                    link.style.color = '#2A1A1F';
                    link.style.fontWeight = 'bold';
                }
            });
        }

        initModal();
    } catch (err) {
        console.error('Ошибка загрузки шапки или модалки:', err);
    }
}

loadHeader();
