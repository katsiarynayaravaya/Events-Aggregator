document.addEventListener("DOMContentLoaded", () => {
    const eventsTitle = document.getElementById("eventsTitle");
    const eventsContent = document.getElementById("eventsContent");

    document.body.addEventListener("click", (e) => {
        const link = e.target.closest('.categories a');
        const siteTitle = e.target.closest('.site-title');

        if (siteTitle) {
            e.preventDefault();
            resetToPopular();
            clearActiveCategory();
            return;
        }

        if (link) {
            e.preventDefault();
            const categoryName = link.dataset.name;
            updateCategoryView(categoryName);
            setActiveCategory(link);
        }
    });

    function updateCategoryView(categoryName) {
        eventsTitle.textContent = `${categoryName} в Гродно`;
        eventsContent.innerHTML = `<p>Тут будет список событий категории "${categoryName}"</p>`;
    }

    function resetToPopular() {
        eventsTitle.textContent = "Популярное";
        eventsContent.innerHTML = `<p>Тут будет коллаж с мероприятиями</p>`;
    }

    function setActiveCategory(activeLink) {
        clearActiveCategory();
        activeLink.classList.add("active-category");
    }

    function clearActiveCategory() {
        document.querySelectorAll('.categories a').forEach(link => {
            link.classList.remove("active-category");
        });
    }
});