document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
        const categoryLinks = document.querySelectorAll('.categories a[data-category]');
        if (categoryLinks.length > 0) {
            observer.disconnect();

            categoryLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const category = link.getAttribute('data-category');
                    const name = link.getAttribute('data-name');

                    window.location.href = `mainPage.html?category=${encodeURIComponent(category)}&name=${encodeURIComponent(name)}`;
                });
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
