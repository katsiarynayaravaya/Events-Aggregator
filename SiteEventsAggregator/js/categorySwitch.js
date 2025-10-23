document.addEventListener("DOMContentLoaded", () => {
    const eventsTitle = document.getElementById("eventsTitle");
    const eventsContent = document.getElementById("eventsContent");

    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category");
    const categoryName = urlParams.get("name");

    const observer = new MutationObserver(() => {
        const categoryLinks = document.querySelectorAll('.categories a');
        if (categoryLinks.length > 0) {
            observer.disconnect();

            if (categoryParam && categoryName) {
                updateCategoryView(categoryName);
                setActiveCategoryByCode(categoryParam);
            }

            document.body.addEventListener("click", (e) => {
                const link = e.target.closest('.categories a');
                const siteTitle = e.target.closest('.site-title');

                if (siteTitle) {
                    e.preventDefault();
                    window.location.href = "mainPage.html";
                    return;
                }

                if (link) {
                    e.preventDefault(); 
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    function updateCategoryView(name) {
        eventsTitle.textContent = `${name} в Гродно`;
        eventsContent.innerHTML = `<p>Тут будет список событий категории "${name}"</p>`;
    }

    function setActiveCategoryByCode(category) {
        clearActiveCategory();
        document.querySelectorAll('.categories a').forEach(link => {
            if (link.dataset.category === category) {
                link.classList.add("active-category");
            }
        });
    }

    function clearActiveCategory() {
        document.querySelectorAll('.categories a').forEach(link => {
            link.classList.remove("active-category");
        });
    }
});
