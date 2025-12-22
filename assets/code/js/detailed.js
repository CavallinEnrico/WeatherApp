// toggle theme
const toggleThemeButton = document.querySelector(".toggle-theme")

toggleThemeButton.addEventListener("click", () => {
    document.body.classList.toggle("light")
})