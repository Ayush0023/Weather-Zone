// JavaScript file for the Weather Application 
const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const weatherCardsDiv = document.querySelector(".weather-cards");
const currentWeatherDiv = document.querySelector(".current-weather");

// ✅ NO API KEY NEEDED - Open-Meteo API is completely free!

// Weather code to description mapping
const weatherDescriptions = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail"
};

// Get weather icon based on weather code
const getWeatherIcon = (weatherCode) => {
  if (weatherCode === 0) return "☀️";
  if (weatherCode === 2 || weatherCode === 3) return "☁️";
  if (weatherCode === 45 || weatherCode === 48) return "🌫️";
  if (weatherCode >= 51 && weatherCode <= 67) return "🌧️";
  if (weatherCode >= 71 && weatherCode <= 86) return "❄️";
  if (weatherCode >= 95) return "⛈️";
  return "🌤️";
};

// Function to create weather card HTML
const createWeatherCard = (cityName, weatherData, index, date) => {
  const temp = weatherData.temperature ? weatherData.temperature.toFixed(1) : "N/A";
  const weatherCode = weatherData.weather_code || 0;
  const description = weatherDescriptions[weatherCode] || "Unknown";
  const icon = getWeatherIcon(weatherCode);
  const windSpeed = weatherData.wind_speed || weatherData.windspeed_10m || 0;
  const humidity = weatherData.humidity || "N/A";
  
  if (index === 0) {  // Main weather card
    return `
      <div class="details">
        <h2>${cityName}</h2>
        <h4>${date}</h4> 
        <h4>Wind Speed: ${windSpeed} m/s</h4>
        <h4>Humidity: ${humidity} %</h4>
        <h4>Air Quality: Good</h4>
      </div>
      <img src="graph.png" alt="line-graph" id="line-grap">
      <div class="icon">
        <h1>${icon}</h1>
        <h4>${description}</h4>
      </div>`;
  } else { // Forecast cards
    return `
      <li class="card">
        <h3>${cityName} (${date})</h3>
        <h1>${icon}</h1>
        <h4>Desc: ${description}</h4>
        <h4>Temperature: ${temp}°C</h4>
        <h4>Wind Speed: ${windSpeed} m/s</h4>
        <h4>Humidity: ${humidity} %</h4>
        <h4>Air Quality: Good</h4>
      </li>`;
  }
};

// Get city coordinates using Open-Meteo Geocoding
const getCityCoordinates = async () => {
  const cityName = cityInput.value.trim();
  if (!cityName) return;

  try {
    // Use Open-Meteo Geocoding (free, no API key needed)
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`
    );
    
    if (!geoResponse.ok) {
      throw new Error(`Geocoding error! Status: ${geoResponse.status}`);
    }
    
    const geoData = await geoResponse.json();
    console.log("Geocoding Data:", geoData);
    
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Please try another name.");
    }

    const { latitude, longitude, name, country } = geoData.results[0];
    const fullCityName = `${name}, ${country}`;
    
    getWeatherDetails(fullCityName, latitude, longitude);
  } catch (error) {
    console.error("Error fetching city coordinates:", error);
    alert("❌ Error: " + error.message);
  }
};

// Get weather details using Open-Meteo Weather API
const getWeatherDetails = async (cityName, lat, lon) => {
  try {
    console.log(`Fetching weather for: ${cityName} (${lat}, ${lon})`);
    
    // Open-Meteo Weather API (free, no API key needed)
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto`
    );
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error! Status: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json();
    console.log("Weather Data:", weatherData);

    // Clear previous data
    cityInput.value = "";
    currentWeatherDiv.innerHTML = "";
    weatherCardsDiv.innerHTML = "";

    // Process current weather
    const current = weatherData.current;
    const daily = weatherData.daily;
    
    // Create current weather card
    const currentDate = new Date(current.time).toLocaleDateString();
    const currentWeatherInfo = {
      temperature: current.temperature_2m,
      weather_code: current.weather_code,
      wind_speed: current.wind_speed_10m,
      humidity: current.relative_humidity_2m
    };
    
    currentWeatherDiv.insertAdjacentHTML(
      "beforeend", 
      createWeatherCard(cityName, currentWeatherInfo, 0, currentDate)
    );

    // Create forecast cards for next 5 days
    for (let i = 1; i < Math.min(5, daily.time.length); i++) {
      const forecastDate = new Date(daily.time[i]).toLocaleDateString();
      const forecastInfo = {
        temperature: (daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2,
        weather_code: daily.weather_code[i],
        wind_speed: daily.wind_speed_10m_max[i],
        humidity: daily.relative_humidity_2m_max[i]
      };
      
      weatherCardsDiv.insertAdjacentHTML(
        "beforeend",
        createWeatherCard(cityName, forecastInfo, i, forecastDate)
      );
    }

    console.log(`Map update: Latitude: ${lat}, Longitude: ${lon}`);
    updateMap(lat, lon);
    
  } catch (error) {
    console.error("Error fetching weather details:", error);
    alert("❌ Error: " + error.message);
  }
};

// Get user's current coordinates
const getUserCoordinates = () => {
  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      
      // Use reverse geocoding to get city name
      fetch(
        `https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`
      )
        .then(res => res.json())
        .then(data => {
          const cityName = data.results?.[0]?.name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          getWeatherDetails(cityName, latitude, longitude);
        })
        .catch(() => alert("Error finding your location name"));
    },
    error => {
      if (error.code === error.PERMISSION_DENIED) {
        alert("Geolocation request denied. Please allow location access.");
      }
    }
  );
};

// Event listeners
searchButton.addEventListener("click", getCityCoordinates);
locationButton.addEventListener("click", getUserCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

// Windy API setup
const options = {
  key: 'H3MzWInDcItupZcD6PvvOdQ92hG6mNKw', // Your Windy API key
  lat: 19.0760,
  lon: 72.8777,
  zoom: 10,
};

let windyAPI;

windyInit(options, (api) => {
  windyAPI = api;
});

// Function to update the Windy map
const updateMap = (lat, lon) => {
  console.log(`Updating map to: Latitude: ${lat}, Longitude: ${lon}`);
  if (windyAPI) {
    if (typeof windyAPI.map.setView === 'function') {
      windyAPI.map.setView([lat, lon], 12);
    } else {
      console.error("setView method not available on windyAPI.map");
    }
  } else {
    console.error("Windy API not initialized.");
  }
};

// Dark mode functionality
const darkModeToggle = document.querySelector('.dark-mode-toggle');
const body = document.body;
const icon = darkModeToggle.querySelector('i');

// Initialize dark mode based on saved preference
if (localStorage.getItem('darkMode') === 'enabled') {
  body.classList.add('dark-mode');
  icon.classList.remove('fa-sun');
  icon.classList.add('fa-moon');
}

// Toggle dark mode on button click
darkModeToggle.addEventListener('click', function () {
  body.classList.toggle('dark-mode');

  if (body.classList.contains('dark-mode')) {
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
    localStorage.setItem('darkMode', 'enabled');
  } else {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
    localStorage.setItem('darkMode', 'disabled');
  }
});
