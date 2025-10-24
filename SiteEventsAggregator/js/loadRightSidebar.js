async function loadRightSidebar() {
    const container = document.querySelector('#rightSidebarContainer');
    try {
        const response = await fetch('/html/rightSidebar.html');
        if (!response.ok) throw new Error(`Ошибка загрузки rightSidebar.html: ${response.status}`);
        container.innerHTML = await response.text();

        if (typeof initCalendar === "function") {
            initCalendar();
        }
    } catch (err) {
        console.error(err);
    }
}

loadRightSidebar();
