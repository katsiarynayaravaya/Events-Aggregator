document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';

    const resultsTitle = document.getElementById('searchResultsTitle');
    resultsTitle.textContent = `Результаты поиска "${decodeURIComponent(query)}"`;

    const checkHeader = setInterval(() => {
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            clearInterval(checkHeader);
            searchInput.value = decodeURIComponent(query);
        }
    }, 100);
});
