const params = new URLSearchParams(window.location.search);
const category = params.get('cat');

const titleElement = document.getElementById('categoryTitle');
if (category) {
    titleElement.textContent = decodeURIComponent(category);
}
