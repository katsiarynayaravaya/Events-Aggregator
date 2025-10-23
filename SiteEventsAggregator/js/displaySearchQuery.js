document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';

    const resultsTitle = document.getElementById('searchResultsTitle');
    resultsTitle.textContent = `Результаты поиска "${decodeURIComponent(query)}"`;

    const observer = new MutationObserver(() => {
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            observer.disconnect();
            searchInput.value = decodeURIComponent(query);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
