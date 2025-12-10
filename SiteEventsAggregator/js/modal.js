function initModal() {
    const authModal = document.getElementById("authModal");
    const closeModal = document.getElementById("closeModal");
    const loginLink = document.querySelector(".login");
    const registerLink = document.querySelector(".register");

    if (!loginLink || !registerLink || !authModal) {
        console.log('Элементы модалки ещё не загружены, пробуем через 100мс');
        setTimeout(initModal, 100);
        return;
    }

    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");
    const resetTab = document.getElementById("resetTab");

    const toRegister = document.getElementById("toRegister");
    const toLoginFromReg = document.getElementById("toLoginFromReg");
    const forgotLink = document.getElementById("forgotLink");
    const toRegisterFromReset = document.getElementById("toRegisterFromReset");
    const toLoginFromReset = document.getElementById("toLoginFromReset");

    loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        openModal("login");
    });

    registerLink.addEventListener("click", (e) => {
        e.preventDefault();
        openModal("register");
    });

    function openModal(tab) {
        if (authModal) {
            authModal.classList.add("active");
            switchTab(tab);
            document.body.style.overflow = "hidden";
        }
    }

    function closeAuthModal() {
        if (authModal) {
            authModal.classList.remove("active");
            document.body.style.overflow = "";
        }
    }

    function switchTab(tab) {
        if (loginTab && registerTab && resetTab) {
            [loginTab, registerTab, resetTab].forEach(el => el.classList.remove("active"));
            clearInputs();

            if (tab === "login" && loginTab) loginTab.classList.add("active");
            if (tab === "register" && registerTab) registerTab.classList.add("active");
            if (tab === "reset" && resetTab) resetTab.classList.add("active");
        }
    }

    function clearInputs() {
        if (authModal) {
            authModal.querySelectorAll("input").forEach(input => {
                if (input.type === "checkbox") {
                    input.checked = false;
                } else {
                    input.value = "";
                }
            });
        }
    }

    if (closeModal) {
        closeModal.addEventListener("click", () => closeAuthModal());
    }

    if (authModal) {
        authModal.addEventListener("click", (e) => {
            if (e.target === authModal) closeAuthModal();
        });
    }

    if (toRegister) {
        toRegister.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab("register");
        });
    }

    if (toLoginFromReg) {
        toLoginFromReg.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab("login");
        });
    }

    if (forgotLink) {
        forgotLink.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab("reset");
        });
    }

    if (toRegisterFromReset) {
        toRegisterFromReset.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab("register");
        });
    }

    if (toLoginFromReset) {
        toLoginFromReset.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab("login");
        });
    }

    document.querySelectorAll(".toggle-password").forEach(toggle => {
        toggle.addEventListener("click", () => {
            const input = toggle.previousElementSibling;
            const icon = toggle.querySelector("i");

            if (input.type === "password") {
                input.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                input.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });
    });

    console.log('Модалка инициализирована');
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initModal, 200);
});