const authModal = document.getElementById("authModal");
const closeModal = document.getElementById("closeModal");
const loginLink = document.querySelector(".login");
const registerLink = document.querySelector(".register");

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

closeModal.addEventListener("click", () => closeAuthModal());
authModal.addEventListener("click", (e) => {
    if (e.target === authModal) closeAuthModal();
});

toRegister.addEventListener("click", (e) => {
    e.preventDefault();
    switchTab("register");
});

toLoginFromReg.addEventListener("click", (e) => {
    e.preventDefault();
    switchTab("login");
});

forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    switchTab("reset");
});

toRegisterFromReset.addEventListener("click", (e) => {
    e.preventDefault();
    switchTab("register");
});

toLoginFromReset.addEventListener("click", (e) => {
    e.preventDefault();
    switchTab("login");
});

function openModal(tab) {
    authModal.classList.add("active");
    switchTab(tab);
    document.body.style.overflow = "hidden";
}

function closeAuthModal() {
    authModal.classList.remove("active");
    document.body.style.overflow = "";
}

function switchTab(tab) {
    [loginTab, registerTab, resetTab].forEach(el => el.classList.remove("active"));
    clearInputs();

    if (tab === "login") loginTab.classList.add("active");
    if (tab === "register") registerTab.classList.add("active");
    if (tab === "reset") resetTab.classList.add("active");
}

function clearInputs() {
    authModal.querySelectorAll("input").forEach(input => {
        if (input.type === "checkbox") {
            input.checked = false;
        } else {
            input.value = "";
        }
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
