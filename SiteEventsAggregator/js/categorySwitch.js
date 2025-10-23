document.addEventListener("DOMContentLoaded", () => {
    const eventsTitle = document.getElementById("eventsTitle");
    const eventsContent = document.getElementById("eventsContent");

    // --- 1️⃣ Проверяем URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const categoryName = urlParams.get("name");

    // --- 2️⃣ Ждём подгрузки header ---
    const checkHeader = setInterval(() => {
        const categoryLinks = document.querySelectorAll('.categories a');
        if (categoryLinks.length > 0) {
            clearInterval(checkHeader);

            // Если категория есть в URL, устанавливаем заголовок и подсветку
            if (categoryName) {
                updateCategoryView(categoryName);
                setActiveCategoryByName(categoryName);
            }

            // --- 3️⃣ Обработчик кликов ---
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
                    // Не меняем заголовок при клике, редирект делает это
                }
            });
        }
    }, 100); // проверяем каждые 100 мс

    // --- 4️⃣ Функции ---
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

    function setActiveCategoryByName(name) {
        clearActiveCategory();
        document.querySelectorAll('.categories a').forEach(link => {
            if (link.dataset.name === name) {
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
