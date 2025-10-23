// /js/categoryRedirect.js
document.addEventListener('DOMContentLoaded', () => {
    const checkHeader = setInterval(() => {
        const categoryLinks = document.querySelectorAll('.categories a[data-category]');
        if (categoryLinks.length > 0) {
            clearInterval(checkHeader);

            categoryLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault(); // предотвращаем мгновенное срабатывание categorySwitch
                    const category = link.getAttribute('data-category');
                    const name = link.getAttribute('data-name');

                    // Перенаправляем на mainPage с параметром
                    window.location.href = `mainPage.html?category=${encodeURIComponent(category)}&name=${encodeURIComponent(name)}`;
                });
            });
        }
    }, 100);
});
