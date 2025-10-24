document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const day = params.get("day");
    const month = params.get("month");
    const year = params.get("year");

    const titleEl = document.getElementById("eventsTitle");
    if (day && month && year && titleEl) {
        titleEl.textContent = `События в Гродно ${day}.${month}.${year}`;
    }
});
