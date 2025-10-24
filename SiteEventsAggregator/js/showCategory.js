const params = new URLSearchParams(window.location.search);
const category = params.get('cat');

const titleElement = document.getElementById('categoryTitle');
if (category && titleElement) {
    titleElement.textContent = `${decodeURIComponent(category)} в Гродно`;
}

function tryHighlightCategory() {
    const categoryLinks = document.querySelectorAll('.sub-bar .categories a');
    if (!categoryLinks || categoryLinks.length === 0) return false;

    let found = false;
    categoryLinks.forEach(link => {
        let linkCat = null;
        try {
            const url = new URL(link.href, window.location.origin);
            linkCat = url.searchParams.get('cat');
        } catch (e) {
            const href = link.getAttribute('href') || '';
            const parts = href.split('cat=');
            if (parts[1]) linkCat = parts[1].split('&')[0];
        }

        if (linkCat) {
            if (decodeURIComponent(linkCat) === decodeURIComponent(category || '')) {
                link.classList.add('active-category');
                found = true;
            } else {
                link.classList.remove('active-category');
            }
        }
    });

    return found;
}

if (!tryHighlightCategory()) {
    const observer = new MutationObserver((mutations, obs) => {
        if (tryHighlightCategory()) {
            obs.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const pollInterval = setInterval(() => {
        if (tryHighlightCategory()) {
            clearInterval(pollInterval);
            observer.disconnect();
        }
    }, 250);

    setTimeout(() => {
        clearInterval(pollInterval);
        observer.disconnect();
    }, 5000);
}