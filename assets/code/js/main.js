
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

// Lista delle regioni e corrispettive province, questo riduce il numero di API calls
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

// Funzione che tradude un weatherCode (codice che descrive il meteo generale di una località) in un'immagine
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


const regionSelect = document.getElementById("region"); // constante del selettore della regione nel DOM
const provinceSelect = document.getElementById("province"); // constante del selettore della provincia nel DOM
const comuneSearchInput = document.getElementById("comuneSearch"); // constante del selettore del comune nel DOM
const comuniDatalist = document.getElementById("comuniList"); // constante della lista dei comuni nel selettore dei comuni nel DOM (selettore con ricerca customizzato)
const inviaBtn = document.getElementById("inviaBtn"); // constante del pulsante dell'invio del form nel DOM



// aggiunge le regioni al selettore
for (const regione in regioniProvince) {
    const option = document.createElement("option");
    option.value = regione;
    option.textContent = regione;
    regionSelect.appendChild(option);
}

// inizializza la mappa
let map = L.map('map').setView([45.517, 11.967], 10);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const comuniLayer = L.layerGroup().addTo(map); // Lista dei cerchi dei comuni attualmente presenti sulla mappa
const cerchiComuni = {}; // Lista simile a comuniLayer ma strutturata diversamente, questa collega un nome al suo rispettivo cerchio sulla mappa, utile per la ricerca customizzata dei comuni 
                        // oltre ad avere qualche dettaglio sul comune in più come weather code

regionSelect.addEventListener("change", function () { // EventListener del regioneSelect, in base alla regione cambia i contenuti di provinceSelect
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


let listaComuni = []; // lista di tutti i 7900~ comuni
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
let comuneSelezionato = null; // comune attualmente selezionato, nonostante qui sia null questa variabile contiene il nome, la latitudine e la longitudine, per rendere il trasferimento alla pagina dettagliata più facile
const comuneSelezionatoSpan = document.getElementById("comuneSelezionato"); // oggetto nel DOM che mostra il comune selezionato
const defaultComuneText = comuneSelezionatoSpan.textContent; // testo default per il comune selezionato
// IMPORTANTE

provinceSelect.addEventListener("input", function () {
    comuniLayer.clearLayers(); // rimuove cerchi esistenti
    for (const k in cerchiComuni) delete cerchiComuni[k]; // rimuove cerchi esistenti

    for (const comune of listaComuni) { // per comune in comuni
        if (comune.provincia == provinceSelect.value) { // se la provincia del comune è uguale alla provincia selezionata
            geocodeComune(comune.nome).then(latlong => {
                comune.lat = latlong[0];
                comune.lon = latlong[1];
                comune.weatherCode = null;

                let cerchio = L.circle([comune.lat, comune.lon], { // creazione del cerchio
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5,
                    radius: 1000
                }).addTo(comuniLayer); // aggiunta del cerchio alla mappa
                cerchiComuni[comune.nome] = cerchio;

                const urlW = `https://api.open-meteo.com/v1/forecast?latitude=${comune.lat}&longitude=${comune.lon}&current=weather_code`
                fetch(urlW) // ottiene il weather code per il comune
                    .then(res => {
                        if (!res.ok) throw new Error("Weather fetch failed");
                        return res.json();
                    })
                    .then(data => {
                        comune.weatherCode = data.current.weather_code;
                    })
                    .catch(err => console.error(err));

                cerchio.on('click', function (e) { // EventListener se clicchi il cerchio del comune sulla mappa apre il popup del comune
                    map.setView(e.latlng, 11);
                    apriPopupComune(comune, e.latlng);
                });

            })
                .catch(err => console.warn(err.message));
        }

    }

    comuneSearchInput.addEventListener("keydown", function (e) { // EventListener della ricerca del comune, in caso venga selezionato un comune attraverso quel selettore
        if (e.key !== "Enter") return;

        const nomeComune = this.value;
        if (!cerchiComuni[nomeComune]) return;

        const cerchio = cerchiComuni[nomeComune];
        const latlng = cerchio.getLatLng();

        map.setView(latlng, 11);

        cerchio.fire("click"); // Simula click sul cerchio, evita la creazione di un altra funzione
        inviaBtn.disabled = false;
    });


    function apriPopupComune(comune, latlng) { // apre il popup del comune dato in input
        popup
            .setLatLng(latlng)
            .setContent(`
                    Comune di: <b>${comune.nome}</b><br>
                    <img src="${weatherCodeToImage(comune.weatherCode)}"
                        style="width:100px;height:auto;">
                `)
            .openOn(map);

        comuneSelezionato = { // salva comune selezionato
            nome: comune.nome,
            lat: latlng.lat,
            lon: latlng.lng
        };

        comuneSelezionatoSpan.textContent = comune.nome; // cambia il testo del comune nel DOM
    }

    inviaBtn.addEventListener("click", function () { // pulsante del invio del forum, invia i dati alla pagina dettagliata

        const url = `assets/code/detailed.html?` +
            `comune=${encodeURIComponent(comuneSelezionato.nome)}` +
            `&lat=${comuneSelezionato.lat}` +
            `&lon=${comuneSelezionato.lon}`;

        window.location.href = url;
    });




    geocodeComune(provinceSelect.value) // posiziona la visuale della mappa sulla provincia selezionata
        .then(latlong => {
            map.setView(latlong, 8); 
            let popup = L.popup() // volevo che aprisse il popup della provincia per mostrare l'immagine del meteo generale e dove fosse il centro della provincia, ma non funziona
                .setLatLng([latlong])
                .setContent(provinceSelect.value)
                .openOn(map);
        })
        .catch(err => console.warn("Provincia non trovata:", err.message));

    // reset input e list dei comuni
    comuneSearchInput.value = "";
    comuniDatalist.innerHTML = "";
    comuneSearchInput.disabled = false;

    // carica comuni della provincia nella list dei comuni
    for (const comune of listaComuni) {
        if (comune.provincia === provinceSelect.value) {
            const option = document.createElement("option");
            option.value = comune.nome;
            comuniDatalist.appendChild(option);
        }
    }

});

comuneSearchInput.addEventListener("change", function () { // EventListener per il selettore custom dei comuni
    const nomeComune = this.value;
    if (!nomeComune) return;

    geocodeComune(nomeComune)
        .then(latlong => {
            map.setView(latlong, 11);

            const urlW = `https://api.open-meteo.com/v1/forecast?latitude=${latlong[0]}&longitude=${latlong[1]}&current=weather_code`; // ho notato ora che questo è ridondante ma non ho tempo di sistemarlo

            fetch(urlW) // ottiene il weather code, e crea il popup, anche questo ridondante
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


                    comuneSelezionato = { // cambia il comune selezionato
                        nome: nomeComune,
                        lat: latlong[0],
                        lon: latlong[1]
                    };

                    comuneSelezionatoSpan.textContent = nomeComune; // mostra il nuovo comune selezionato nel DOM
                });
        })
        .catch(err => console.warn(err.message));
});


function geocodeComune(nomeComune) { // trova la posizione del comune dato
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nomeComune)}&count=1&language=it&country=IT&format=json`;

    return fetch(url) // API call, con vari controlli che sia andata a buon fine
        .then(response => response.json())
        .then(data => {
            if (!data.results || data.results.length === 0) {
                throw new Error(`Nessun risultato per: ${nomeComune}`);
            }

            // Scarta risultati non appartenenti alla provincia selezionata
            let r = data.results[0];
            if (
                r.admin2 &&
                !r.admin2.toLowerCase().includes(provinceSelect.value.toLowerCase()) // scarta risultati non appartenenti alla provincia selezionata
            ) {
                throw new Error(`Comune ${nomeComune} non nella provincia selezionata`);
            }


            if (r.country_code !== "IT") { // Scarta risultati non italiani
                throw new Error(`Risultato non italiano per: ${nomeComune}`);
            }

            return [r.latitude, r.longitude]; // se tutto è andato a buon fine ottiene la latitudine e longitudine del comune
        });
}
