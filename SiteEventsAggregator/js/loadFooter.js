document.addEventListener("DOMContentLoaded", () => {
    fetch("/html/footer.html")
        .then(response => {
            if (!response.ok) throw new Error("Ошибка загрузки футера");
            return response.text();
        })
        .then(html => {
            document.body.insertAdjacentHTML("beforeend", html);
        })
        .catch(error => {
            console.error("Не удалось загрузить футер:", error);
        });
});