const urlParams = new URLSearchParams(window.location.search)
const lat = urlParams.get('lat')
const lon = urlParams.get('lon')
const name = urlParams.get('comune')


// Alterna tema chiaro-scuro
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


// Aggiorna orologio navbar
function updateClock() {
    const clockElement = document.querySelector(".clock")
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    clockElement.textContent = `${hours}:${minutes}`
}

setInterval(updateClock, 3000);


// Chiamata all'API open-meteo e assegnazione valori in detailed.html
async function fetchDailyWeather(dateDiff) {
    const date = formatDate(dateDiff)

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m&timezone=auto&start_date=${date}&end_date=${date}`
    const weatherData = await fetch(url)
    const weatherJson = await weatherData.json()
    const dailyData = weatherJson.daily || { temperature_2m_max: [null], temperature_2m_min: [null], precipitation_sum: [null] }

    // Trova l'indice delle misurazioni dell'ora corrente per accedere al meteo di giorni diversi alla stessa ora
    const now = new Date()
    const targetHour = String(now.getHours()).padStart(2, '0')
    let hourIndex = -1
    if (weatherJson.hourly && Array.isArray(weatherJson.hourly.time)) {
        const times = weatherJson.hourly.time
        for (let i = 0; i < times.length; i++) {
            if (times[i].slice(0, 10) === date && times[i].slice(11, 13) === targetHour) {
                hourIndex = i
                break
            }
        }
    }

    // Estrai i valori da .hourly se presenti, altrimenti i valori del meteo corrente o null
    let temp, humidity, precip, windSpeed, windDir, apparent
    if (hourIndex >= 0 && weatherJson.hourly) {
        const h = weatherJson.hourly
        temp = h.temperature_2m ? h.temperature_2m[hourIndex] : null
        humidity = h.relative_humidity_2m ? h.relative_humidity_2m[hourIndex] : null
        precip = h.precipitation ? h.precipitation[hourIndex] : null
        windSpeed = h.wind_speed_10m ? h.wind_speed_10m[hourIndex] : null
        windDir = h.wind_direction_10m ? h.wind_direction_10m[hourIndex] : null
        apparent = h.apparent_temperature ? h.apparent_temperature[hourIndex] : temp
    } else if (weatherJson.current) {
        const currentData = weatherJson.current
        temp = currentData.temperature_2m
        humidity = currentData.relative_humidity_2m
        precip = currentData.precipitation
        windSpeed = currentData.wind_speed_10m
        windDir = currentData.wind_direction_10m
        apparent = currentData.apparent_temperature
    } else {
        temp = dailyData.temperature_2m_max[0]
        humidity = null
        precip = dailyData.precipitation_sum[0]
        windSpeed = null
        windDir = null
        apparent = temp
    }

    document.querySelector("#temp-value").innerText = `${temp}°C`
    document.querySelector("#humidity-value").innerText = `${humidity ?? '-'}%`
    document.querySelector("#precipitations-value").innerText = `${precip ?? '-'}mm`
    document.querySelector("#precipitations-sum-value").innerText = `${dailyData.precipitation_sum[0]}`
    document.querySelector("#wind-value").innerText = `${windSpeed ?? '-'}km/h`
    document.querySelector("#wind-dir-value").innerText = "Direzione: " + calculateWindDirection(windDir)
    document.querySelector("#feels-like-value").innerText = `${apparent}°C`
    document.querySelector("#max-value").innerText = `${dailyData.temperature_2m_max[0]}°C`
    document.querySelector("#min-value").innerText = `${dailyData.temperature_2m_min[0]}°C`

    presentationData = await fetchPresentation(dailyData.precipitation_sum, temp, apparent, dailyData.temperature_2m_max[0], dailyData.temperature_2m_min[0], humidity, windSpeed, calculateWindDirection(windDir))
}


// Converte i gradi in punti cardinali
function calculateWindDirection(degree) {
    const d = Number(degree)
    if (Number.isNaN(d)) return "Error"
    if (d >= 22.5 && d < 67.5) return "NE"
    if (d >= 67.5 && d < 112.5) return "E"
    if (d >= 112.5 && d < 157.5) return "SE"
    if (d >= 157.5 && d < 202.5) return "S"
    if (d >= 202.5 && d < 247.5) return "SW"
    if (d >= 247.5 && d < 292.5) return "W"
    if (d >= 292.5 && d < 337.5) return "NW"
    return "N"
}


// Chiamata all'API generate_response per la presentazione metereologica
async function fetchPresentation(prec, temp, feelsLike, maxTemp, minTemp, humidity, windSpeed, windDir) {
    const presentationData = await fetch(`https://weather-app-backend-mu-weld.vercel.app/api/generate_response?precipitationsStr=${prec}&actual_temperatureStr=${temp}&feels_like_temperatureStr=${feelsLike}&max_temperatureStr=${maxTemp}&min_temperatureStr=${minTemp}&humidityStr=${humidity}&wind_speedStr=${windSpeed}&wind_direction=${windDir}`, { method: "GET" })
    const presentationJson = await presentationData.json()
    document.querySelector("#presentation-paragraph").innerText = presentationJson.message
}


// Restituisce una data in formato YYYY-MM-DD dalla differenze in giorni da quella corrente
function formatDate(diff) {
    const date = new Date()
    date.setDate(date.getDate() + Number(diff))
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}


document.addEventListener("DOMContentLoaded", () => {
    const ids = ["d-5", "d-4", "d-3", "d-2", "d-1", "d0", "d+1", "d+2", "d+3", "d+4", "d+5"]

    const elems = ids.flatMap(id => Array.from(document.querySelectorAll(`[id="${id}"]`))).filter(Boolean)

    function idToDiff(id) {
        if (!id || id[0] !== 'd') return 0
        const suffix = id.slice(1)
        const n = parseInt(suffix, 10)
        return Number.isNaN(n) ? 0 : n
    }

    function setActive(selected) {
        elems.forEach(el => el.classList.remove("active"))
        const sameId = Array.from(document.querySelectorAll(`[id="${selected.id}"]`))
        sameId.forEach(el => el.classList.add("active"))
        const diff = idToDiff(selected.id)
        fetchDailyWeather(diff)
    }

    elems.forEach(el => {
        el.addEventListener("click", () => setActive(el))
    })

    // Centra il selettore del giorno selezionato in caso di overflow da mobile
    const mobileContainer = document.querySelector('.day-selector-mobile')
    function centerMobileForId(id, smooth = true) {
        if (!mobileContainer) return
        if (mobileContainer.scrollWidth <= mobileContainer.clientWidth) return
        const mobileEl = Array.from(document.querySelectorAll(`[id="${id}"]`)).find(el => el.closest('.day-selector-mobile'))
        if (!mobileEl) return
        try {
            mobileEl.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', inline: 'center', block: 'nearest' })
        } catch (e) {
            const offset = mobileEl.offsetLeft - (mobileContainer.clientWidth - mobileEl.clientWidth) / 2
            mobileContainer.scrollTo({ left: offset, behavior: smooth ? 'smooth' : 'auto' })
        }
    }

    elems.forEach(el => {
        el.addEventListener('click', () => centerMobileForId(el.id, true))
    })

    const initialActive = Array.from(document.querySelectorAll('.day-slide-content-mobile.active'))[0]
    if (initialActive) centerMobileForId(initialActive.id, false)
})