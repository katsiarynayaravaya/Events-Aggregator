document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            observer.disconnect();

            searchInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    const query = encodeURIComponent(searchInput.value.trim());
                    if (query) {
                        window.location.href = `searchResults.html?q=${query}`;
                    }
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
