const urlParams = new URLSearchParams(window.location.search)
const lat = urlParams.get('lat')
const lon = urlParams.get('lon')
const name = urlParams.get('comune')

// toggle theme
const toggleThemeButton = document.querySelector("#toggle-theme")

toggleThemeButton.addEventListener("click", () => {
    document.body.classList.toggle("light")
    if (document.body.classList.contains("light")) {
        toggleThemeButton.src = "../downloads/logos/moon.svg"
        document.querySelectorAll(".app-title img").forEach((img) => {
            img.style.filter = "invert(0.7)"
        })
    } else {
        toggleThemeButton.src = "../downloads/logos/sun.svg"
        document.querySelectorAll(".app-title img").forEach((img) => {
            img.style.filter = "invert(0)"
        })
    }
})

document.addEventListener("DOMContentLoaded", () => {
    updateClock()
    fetchDailyWeather(0)
    document.title = `Dettagli meteo: ${name}`
    document.querySelector(".app-title h1").innerText = name
})




function updateClock() {
    const clockElement = document.querySelector(".clock")
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    clockElement.textContent = `${hours}:${minutes}`
}

setInterval(updateClock, 3000);

async function fetchDailyWeather(dateDiff) {
    const date = formatDate(dateDiff)
    const weatherData = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto&start_date=${date}&end_date=${date}`)
    const weatherJson = await weatherData.json()
    const currentData = weatherJson.current
    const dailyData = weatherJson.daily

    document.querySelector("#temp-value").innerText = `${currentData.temperature_2m}°C`
    document.querySelector("#humidity-value").innerText = `${currentData.relative_humidity_2m}%`
    document.querySelector("#precipitations-value").innerText = `${currentData.precipitation}mm`
    document.querySelector("#precipitations-sum-value").innerText = `${dailyData.precipitation_sum[0]}mm`
    document.querySelector("#wind-value").innerText = `${currentData.wind_speed_10m}km/h`
    document.querySelector("#wind-dir-value").innerText = calculateWindDirection(currentData.wind_direction_10m)
    document.querySelector("#feels-like-value").innerText = `${currentData.apparent_temperature}°C`
    document.querySelector("#max-value").innerText = `${dailyData.temperature_2m_max[0]}°C`
    document.querySelector("#min-value").innerText = `${dailyData.temperature_2m_min[0]}°C`

    presentationData = await fetchPresentation(dailyData.precipitation_sum, currentData.temperature_2m, currentData.apparent_temperature, dailyData.temperature_2m_max[0], dailyData.temperature_2m_min[0], currentData.relative_humidity_2m, currentData.wind_speed_10m, calculateWindDirection(currentData.wind_direction_10m))
}

function calculateWindDirection(degree) {
    switch (degree) {
        case degree >= 22.5 && degree < 67.5:
            return "NE"
        case degree >= 67.5 && degree < 112.5:
            return "E"
        case degree >= 112.5 && degree < 157.5:
            return "SE"
        case degree >= 157.5 && degree < 202.5:
            return "S"
        case degree >= 202.5 && degree < 247.5:
            return "SW"
        case degree >= 247.5 && degree < 292.5:
            console.log("CIAO")
            return "W"
        case degree >= 292.5 && degree < 337.5:
            return "NW"
        default:
            return "N"
    }
}

async function fetchPresentation(prec, temp, feelsLike, maxTemp, minTemp, humidity, windSpeed, windDir) {
    const presentationData = await fetch(`https://weather-app-backend-mu-weld.vercel.app/api/generate_response?precipitationsStr=${prec}&actual_temperatureStr=${temp}&feels_like_temperatureStr=${feelsLike}&max_temperatureStr=${maxTemp}&min_temperatureStr=${minTemp}&humidityStr=${humidity}&wind_speedStr=${windSpeed}&wind_direction=${windDir}`, { method: "GET" })
    const presentationJson = await presentationData.json()
    document.querySelector("#presentation-paragraph").innerText = presentationJson.message
}

function formatDate(diff) {
    let returnDate = ""
    const date = new Date()
    date.setDate(date.getDate() + diff)
    returnDate = date.getFullYear() + "-"
    if (date.getMonth() + 1 < 10)
        returnDate += "0"
    returnDate += (date.getMonth() + 1)
    returnDate += "-" + date.getDate()
    return returnDate
}

