async function loadHTML(selector, url) {
    const container = document.querySelector(selector);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Ошибка загрузки ${url}: ${response.status}`);
    const html = await response.text();
    container.innerHTML = html;
}

async function loadFooter() {
    try {
        await loadHTML('#footerContainer', '/html/footer.html');
    } catch (err) {
        console.error('Ошибка загрузки футера:', err);
    }
}

loadFooter();
