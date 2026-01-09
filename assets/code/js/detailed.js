// toggle theme
const toggleThemeButton = document.querySelector("#toggle-theme")

toggleThemeButton.addEventListener("click", () => {
    document.body.classList.toggle("light")
    if(document.body.classList.contains("light")) {
        toggleThemeButton.src = "../downloads/logos/moon.svg"
    } else {
        toggleThemeButton.src = "../downloads/logos/sun.svg"
    }
})

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
})




function updateClock() {
    const clockElement = document.querySelector(".clock");
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}`;
}

setInterval(updateClock, 3000);

