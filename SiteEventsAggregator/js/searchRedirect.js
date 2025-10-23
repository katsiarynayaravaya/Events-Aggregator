document.addEventListener('DOMContentLoaded', () => {
    const checkHeader = setInterval(() => {
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            clearInterval(checkHeader);

            searchInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    const query = encodeURIComponent(searchInput.value.trim());
                    if (query) {
                        window.location.href = `searchResults.html?q=${query}`;
                    }
                }
            });
        }
    }, 100);
});
