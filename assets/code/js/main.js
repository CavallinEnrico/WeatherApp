
// toggle theme
const toggleThemeButton = document.querySelector("#toggle-theme")

toggleThemeButton.addEventListener("click", () => {
    document.body.classList.toggle("light")
    if (document.body.classList.contains("light")) {
        toggleThemeButton.src = "assets/downloads/logos/moon.svg"
        document.querySelectorAll(".app-title img").forEach((img) => {
            img.style.filter = "invert(0.7)"
        })
    } else {
        toggleThemeButton.src = "assets/downloads/logos/sun.svg"
        document.querySelectorAll(".app-title img").forEach((img) => {
            img.style.filter = "invert(0)"
        })
    }
})

document.addEventListener("DOMContentLoaded", () => {
    updateClock()
})

function updateClock() {
    const clockElement = document.querySelector(".clock")
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    clockElement.textContent = `${hours}:${minutes}`
}

setInterval(updateClock, 3000);

let popup = L.popup()

const regioniProvince = {
    "Abruzzo": ["Chieti", "L'Aquila", "Pescara", "Teramo"],
    "Basilicata": ["Matera", "Potenza"],
    "Calabria": ["Catanzaro", "Cosenza", "Crotone", "Reggio Calabria", "Vibo Valentia"],
    "Campania": ["Avellino", "Benevento", "Caserta", "Napoli", "Salerno"],
    "Emilia-Romagna": ["Bologna", "Ferrara", "Forlì-Cesena", "Modena", "Parma", "Piacenza", "Ravenna", "Reggio Emilia", "Rimini"],
    "Friuli-Venezia Giulia": ["Gorizia", "Pordenone", "Trieste", "Udine"],
    "Lazio": ["Frosinone", "Latina", "Rieti", "Roma", "Viterbo"],
    "Liguria": ["Genova", "Imperia", "La Spezia", "Savona"],
    "Lombardia": ["Bergamo", "Brescia", "Como", "Cremona", "Lecco", "Lodi", "Mantova", "Milano", "Monza e Brianza", "Pavia", "Sondrio", "Varese"],
    "Marche": ["Ancona", "Ascoli Piceno", "Fermo", "Macerata", "Pesaro e Urbino"],
    "Molise": ["Campobasso", "Isernia"],
    "Piemonte": ["Alessandria", "Asti", "Biella", "Cuneo", "Novara", "Torino", "Verbano-Cusio-Ossola", "Vercelli"],
    "Puglia": ["Bari", "Barletta-Andria-Trani", "Brindisi", "Foggia", "Lecce", "Taranto"],
    "Sardegna": ["Cagliari", "Nuoro", "Oristano", "Sassari", "Sud Sardegna"],
    "Sicilia": ["Agrigento", "Caltanissetta", "Catania", "Enna", "Messina", "Palermo", "Ragusa", "Siracusa", "Trapani"],
    "Toscana": ["Arezzo", "Firenze", "Grosseto", "Livorno", "Lucca", "Massa-Carrara", "Pisa", "Pistoia", "Prato", "Siena"],
    "Trentino-Alto Adige": ["Bolzano", "Trento"],
    "Umbria": ["Perugia", "Terni"],
    "Valle d'Aosta": ["Aosta"],
    "Veneto": ["Belluno", "Padova", "Rovigo", "Treviso", "Venezia", "Verona", "Vicenza"]
};

function weatherCodeToImage(code) {
    if (code === 0) {
        return "assets/downloads/visuals/images/weather/sunny.png";
    }

    if (code === 1) {
        return "assets/downloads/visuals/images/weather/mostly_sunny.png";
    }

    if (code === 2) {
        return "assets/downloads/visuals/images/weather/partly_cloudy.png";
    }

    if (code === 3) {
        return "assets/downloads/visuals/images/weather/cloudy.png";
    }

    if (code === 45 || code === 48) {
        return "assets/downloads/visuals/images/weather/fog.png";
    }

    if (code >= 51 && code <= 57) {
        return "assets/downloads/visuals/images/weather/drizzle.png";
    }

    if (code >= 61 && code <= 67) {
        return "assets/downloads/visuals/images/weather/rain.png";
    }

    if (code >= 71 && code <= 77) {
        return "assets/downloads/visuals/images/weather/snow.png";
    }

    if (code >= 80 && code <= 82) {
        return "assets/downloads/visuals/images/weather/showers.png";
    }

    if (code >= 95 && code <= 99) {
        return "assets/downloads/visuals/images/weather/thunderstorm.png";
    }

    return "assets/downloads/visuals/images/weather/unknown.png";
}


const regionSelect = document.getElementById("region");
const provinceSelect = document.getElementById("province");
const comuneSearchInput = document.getElementById("comuneSearch");
const comuniDatalist = document.getElementById("comuniList");
const inviaBtn = document.getElementById("inviaBtn");



// aggiunge le regioni
for (const regione in regioniProvince) {
    const option = document.createElement("option");
    option.value = regione;
    option.textContent = regione;
    regionSelect.appendChild(option);
}

let map = L.map('map').setView([45.517, 11.967], 10);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const comuniLayer = L.layerGroup().addTo(map);
const cerchiComuni = {};

regionSelect.addEventListener("change", function () {
    const regioneSelezionata = this.value;

    // reset province
    provinceSelect.innerHTML = '<option value="">-- Seleziona provincia --</option>';
    provinceSelect.disabled = true;

    if (!regioneSelezionata) return;

    // aggiunge province della regione
    for (const provincia of regioniProvince[regioneSelezionata]) {
        const option = document.createElement("option");
        option.value = provincia;
        option.textContent = provincia;
        provinceSelect.appendChild(option);
    }

    provinceSelect.disabled = false;
});

let listaComuni = [];

fetch("https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json")
    .then(r => r.json())
    .then(data => {
        data.forEach(comune => {
            listaComuni.push({
                nome: comune.nome,
                provincia: comune.provincia.nome
            });
        });
    })
    .catch(err => console.error(err));

// IMPORTANTE
let comuneSelezionato = null;
const comuneSelezionatoSpan = document.getElementById("comuneSelezionato");
const defaultComuneText = comuneSelezionatoSpan.textContent;
// IMPORTANTE

provinceSelect.addEventListener("input", function () {
    // REMOVE OLD CIRCLES
    comuniLayer.clearLayers();
    for (const k in cerchiComuni) delete cerchiComuni[k];

    for (const comune of listaComuni) {
        if (comune.provincia == provinceSelect.value) {
            geocodeComune(comune.nome).then(latlong => {
                comune.lat = latlong[0];
                comune.lon = latlong[1];
                comune.weatherCode = null;

                let cerchio = L.circle([comune.lat, comune.lon], {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5,
                    radius: 1000
                }).addTo(comuniLayer);
                cerchiComuni[comune.nome] = cerchio;

                const urlW = `https://api.open-meteo.com/v1/forecast?latitude=${comune.lat}&longitude=${comune.lon}&current=weather_code`
                fetch(urlW)
                    .then(res => {
                        if (!res.ok) throw new Error("Weather fetch failed");
                        return res.json();
                    })
                    .then(data => {
                        comune.weatherCode = data.current.weather_code;
                    })
                    .catch(err => console.error(err));

                cerchio.on('click', function (e) {
                    map.setView(e.latlng, 11);
                    apriPopupComune(comune, e.latlng);
                });

            })
                .catch(err => console.warn(err.message));
        }

    }

    comuneSearchInput.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;

        const nomeComune = this.value;
        if (!cerchiComuni[nomeComune]) return;

        const cerchio = cerchiComuni[nomeComune];
        const latlng = cerchio.getLatLng();

        map.setView(latlng, 11);

        // Simula click sul cerchio
        cerchio.fire("click");
        inviaBtn.disabled = false;
    });


    function apriPopupComune(comune, latlng) {
        popup
            .setLatLng(latlng)
            .setContent(`
                    Comune di: <b>${comune.nome}</b><br>
                    <img src="${weatherCodeToImage(comune.weatherCode)}"
                        style="width:100px;height:auto;">
                `)
            .openOn(map);

        // salva comune selezionato (STRUTTURA CHIARA)
        comuneSelezionato = {
            nome: comune.nome,
            lat: latlng.lat,
            lon: latlng.lng
        };

        comuneSelezionatoSpan.textContent = comune.nome;

        // abilita pulsante
        inviaBtn.disabled = false;

    }

    inviaBtn.addEventListener("click", function () {
        //if (!comuneSelezionato) return;

        const url = `assets/code/detailed.html?` +
            `comune=${encodeURIComponent(comuneSelezionato.nome)}` +
            `&lat=${comuneSelezionato.lat}` +
            `&lon=${comuneSelezionato.lon}`;

        window.location.href = url;
    });



    // Zoom sulla provincia usando il suo nome
    geocodeComune(provinceSelect.value)
        .then(latlong => {
            map.setView(latlong, 8); // 10 è uno zoom “provinciale”, puoi regolarlo
            let popup = L.popup()
                .setLatLng([latlong])
                .setContent(provinceSelect.value)
                .openOn(map);
        })
        .catch(err => console.warn("Provincia non trovata:", err.message));

    // reset input e datalist comuni
    comuneSearchInput.value = "";
    comuniDatalist.innerHTML = "";
    comuneSearchInput.disabled = false;

    // carica comuni della provincia nel datalist
    for (const comune of listaComuni) {
        if (comune.provincia === provinceSelect.value) {
            const option = document.createElement("option");
            option.value = comune.nome;
            comuniDatalist.appendChild(option);
        }
    }

});

comuneSearchInput.addEventListener("change", function () {
    const nomeComune = this.value;
    if (!nomeComune) return;

    geocodeComune(nomeComune)
        .then(latlong => {
            map.setView(latlong, 11);

            const urlW = `https://api.open-meteo.com/v1/forecast?latitude=${latlong[0]}&longitude=${latlong[1]}&current=weather_code`;

            fetch(urlW)
                .then(r => r.json())
                .then(data => {
                    popup
                        .setLatLng(latlong)
                        .setContent(`
                                Comune di: <b>${nomeComune}</b><br>
                                <img src="${weatherCodeToImage(data.current.weather_code)}"
                                    style="width:100px;height:auto;">  
                            `)
                        .openOn(map);

                    // ✅ Set the variable for button
                    comuneSelezionato = {
                        nome: nomeComune,
                        lat: latlong[0],
                        lon: latlong[1]
                    };

                    comuneSelezionatoSpan.textContent = nomeComune;
                });
        })
        .catch(err => console.warn(err.message));
});


comuneSearchInput.addEventListener("change", function () {
    if (this.value === "") {
        // trucco per riaprire il datalist
        this.blur();
        this.focus();
        comuneSearchInput.fire("click")
    }
});


function geocodeComune(nomeComune) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nomeComune)}&count=1&language=it&country=IT&format=json`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (!data.results || data.results.length === 0) {
                throw new Error(`Nessun risultato per: ${nomeComune}`);
            }

            let r = data.results[0];
            if (
                r.admin2 &&
                !r.admin2.toLowerCase().includes(provinceSelect.value.toLowerCase())
            ) {
                throw new Error(`Comune ${nomeComune} non nella provincia selezionata`);
            }


            // Scarta risultati non italiani
            if (r.country_code !== "IT") {
                throw new Error(`Risultato non italiano per: ${nomeComune}`);
            }

            return [r.latitude, r.longitude];
        });
}
