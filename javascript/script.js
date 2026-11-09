
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const statusText = document.getElementById("status");

function getWeatherInfo(code) {

    const weather = {
        0: ["Clear Sky", "☀️"],
        1: ["Mainly Clear", "🌤️"],
        2: ["Partly Cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Fog", "🌫️"],
        48: ["Depositing Rime Fog", "🌫️"],
        51: ["Light Drizzle", "🌦️"],
        53: ["Moderate Drizzle", "🌦️"],
        55: ["Dense Drizzle", "🌧️"],
        61: ["Slight Rain", "🌧️"],
        63: ["Moderate Rain", "🌧️"],
        65: ["Heavy Rain", "🌧️"],
        71: ["Slight Snow", "❄️"],
        73: ["Moderate Snow", "❄️"],
        75: ["Heavy Snow", "❄️"],
        80: ["Rain Showers", "🌦️"],
        81: ["Moderate Showers", "🌧️"],
        82: ["Violent Showers", "⛈️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with Hail", "⛈️"],
        99: ["Heavy Thunderstorm", "⛈️"]
    };

    return weather[code] || ["Unknown Weather", "🌤️"];
}

async function getWeather(latitude, longitude, city) {

    try {

        statusText.textContent = "Loading weather data...";

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Weather data unavailable");
        }

        const data = await response.json();

        displayCurrentWeather(data, city);
        displayForecast(data);

        statusText.textContent = "";

    } catch (error) {

        statusText.textContent = "Unable to load weather data. Please try again.";

        console.error(error);
    }
}

function displayCurrentWeather(data, city) {

    const current = data.current;
    const daily = data.daily;

    const weatherInfo = getWeatherInfo(current.weather_code);

    document.getElementById("cityName").textContent = city;

    document.getElementById("date").textContent =
        new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    document.getElementById("temperature").textContent =
        Math.round(current.temperature_2m) + "°";

    document.getElementById("weatherIcon").textContent =
        weatherInfo[1];

    document.getElementById("weatherCondition").textContent =
        weatherInfo[0];

    document.getElementById("feelsLike").textContent =
        Math.round(current.apparent_temperature) + "°C";

    document.getElementById("humidity").textContent =
        current.relative_humidity_2m + "%";

    document.getElementById("windSpeed").textContent =
        current.wind_speed_10m + " km/h";

    document.getElementById("sunrise").textContent =
        daily.sunrise[0].split("T")[1];

    document.getElementById("sunset").textContent =
        daily.sunset[0].split("T")[1];
}

function displayForecast(data) {

    const forecastContainer = document.getElementById("forecast");

    forecastContainer.innerHTML = "";

    const daily = data.daily;

    for (let i = 0; i < daily.time.length; i++) {

        const date = new Date(daily.time[i] + "T12:00:00");

        const day = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const weatherInfo = getWeatherInfo(daily.weather_code[i]);

        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);

        const card = document.createElement("div");

        card.className = "forecast-card";

        card.innerHTML = `
            <p>${day}</p>
            <div class="icon">${weatherInfo[1]}</div>
            <h3>${maxTemp}°C</h3>
            <small>${minTemp}°C</small>
        `;

        forecastContainer.appendChild(card);
    }
}

async function searchCity() {

    const city = cityInput.value.trim();

    if (city === "") {
        statusText.textContent = "Please enter a city name.";
        return;
    }

    try {

        statusText.textContent = "Searching city...";

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("City search failed");
        }

        const result = await response.json();

        if (!result.results || result.results.length === 0) {
            statusText.textContent = "City not found. Try another city.";
            return;
        }

        const location = result.results[0];

        cityInput.value = "";

        await getWeather(
            location.latitude,
            location.longitude,
            location.name
        );

    } catch (error) {

        statusText.textContent = "Unable to search city.";

        console.error(error);
    }
}

function getCurrentLocation() {

    if (!navigator.geolocation) {

        statusText.textContent =
            "Location is not supported by this browser.";

        return;
    }

    statusText.textContent = "Getting your location...";

    navigator.geolocation.getCurrentPosition(

        async function(position) {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            await getWeather(latitude, longitude, "My Location");
        },

        function(error) {

            statusText.textContent =
                "Location access denied or unavailable.";

        }
    );
}

searchBtn.addEventListener("click", searchCity);

cityInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        searchCity();
    }

});

locationBtn.addEventListener("click", getCurrentLocation);

getWeather(6.9271, 79.8612, "Colombo");
