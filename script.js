const apiKey = "7d5e74e7b112e34001dc87b79a2fc7c3";

function debounce(func, delay = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

async function handleSearch() {
  const input = document.getElementById("locationInput");
  const value = input.value.trim();
  const error = document.getElementById("error");
  const currentWeather = document.getElementById("currentWeather");
  const forecastContainer = document.getElementById("forecast");

  error.textContent = "";
  currentWeather.innerHTML = "";
  forecastContainer.innerHTML = "";

  if (!value) {
    error.textContent = "Please enter a city name.";
    return;
  }

  try {
    const geoResponse = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(value)}&limit=1&appid=${apiKey}`
    );

    if (!geoResponse.ok) throw new Error("City not found");

    const data = await geoResponse.json();

    if (data.length === 0) {
      error.textContent = "No matching city found.";
      return;
    }

    const { lat, lon, name, country } = data[0];
    getWeather(lat, lon, name, country);

  } catch (err) {
    console.error(err);
    error.textContent = "Error finding city. Try again.";
  }
}

const condition = weatherData.weather[0].description;

document.body.className = ''; 

if (condition.includes('rain')) {
  document.body.classList.add('rain');
} else if (condition.includes('snow')) {
  document.body.classList.add('snow');
} else if (condition.includes('cloud')) {
  document.body.classList.add('cloudy');
} else {
  document.body.classList.add('clear-sky');
}

async function getWeather(lat, lon, cityName, countryName) {
  const input = document.getElementById("locationInput");
  const error = document.getElementById("error");
  const currentWeather = document.getElementById("currentWeather");
  const forecastContainer = document.getElementById("forecast");

  if (!lat || !lon || !cityName || !countryName) {
    error.textContent = "Invalid location data. Please try another city.";
    return;
  }

  input.value = `${cityName}, ${countryName}`;
  error.textContent = "";
  currentWeather.innerHTML = "Loading current weather...";
  forecastContainer.innerHTML = "";

  try {
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );

    if (!weatherResponse.ok) {
      const text = await weatherResponse.text();
      console.error("Weather API error:", weatherResponse.status, text);
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();

    const iconCode = weatherData.weather?.[0]?.icon || "01d";
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    currentWeather.innerHTML = `
      <h2>${weatherData.name || "Unknown City"}, ${weatherData.sys?.country || ""}</h2>
      <img src="${iconUrl}" alt="Weather Icon" style="width: 80px; height: 80px;">
      <p><strong>Temperature:</strong> ${Math.round(weatherData.main?.temp || 0)}°C</p>
      <p><strong>Condition:</strong> ${weatherData.weather?.[0]?.description || "N/A"}</p>
      <p><strong>Humidity:</strong> ${weatherData.main?.humidity || 0}%</p>
      <p><strong>Wind:</strong> ${weatherData.wind?.speed || 0} m/s</p>
    `;

    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );

    if (!forecastResponse.ok) {
      const text = await forecastResponse.text();
      console.error("Forecast API error:", forecastResponse.status, text);
      throw new Error(`Forecast API error: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();

    const dailyForecast = {};
    forecastData.list?.forEach((item) => {
      const date = item.dt_txt?.split(" ")[0];
      if (!dailyForecast[date]) {
        dailyForecast[date] = item;
      }
    });

    forecastContainer.innerHTML = "<h3>5-Day Forecast</h3>";

    Object.values(dailyForecast).forEach((day, index) => {
      if (index === 0) return;

      const date = new Date(day.dt * 1000).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      const iconCode = day.weather?.[0]?.icon || "01d";
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

      forecastContainer.innerHTML += `
        <div class="forecast-day">
          <p><strong>${date}</strong></p>
          <img src="${iconUrl}" alt="Icon" style="width:30px;height:30px;">
          <p>${Math.round(day.main?.temp_min || 0)}°C - ${Math.round(day.main?.temp_max || 0)}°C</p>
          <p>${day.weather?.[0]?.description || "N/A"}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error("Error fetching weather:", err);
    error.textContent = "Error loading weather data. Try again later.";
    currentWeather.innerHTML = "";
    forecastContainer.innerHTML = "";
  }
}

async function setupAutocomplete() {
  const input = document.getElementById("locationInput");
  const suggestionsBox = document.getElementById("suggestions");

  input.addEventListener("input", debounce(async () => {
    const value = input.value.trim();
    suggestionsBox.innerHTML = "";
    suggestionsBox.classList.remove("show");

    if (!value) return;

    try {
      const response = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(value)}&limit=10&appid=${apiKey}`
      );

      if (!response.ok) throw new Error("Geocoding failed");

      const data = await response.json();

      if (data.length > 0) {
        suggestionsBox.innerHTML = data.map(city =>
          `<div class="suggestion" onclick="getWeather(${city.lat}, ${city.lon}, '${city.name.replace(/'/g, "\\'")}', '${city.country}')">
            ${city.name}, ${city.state ? city.state + ", " : ""}${city.country}
           </div>`
        ).join("");

        suggestionsBox.classList.add("show");
      } else {
        suggestionsBox.innerHTML = `<div class="no-result">No matching cities found.</div>`;
        suggestionsBox.classList.add("show");
      }

    } catch (e) {
      console.error("Autocomplete error:", e);
      suggestionsBox.innerHTML = `<div class="no-result">Error fetching suggestions.</div>`;
      suggestionsBox.classList.add("show");
    }
  }, 600));
}

window.onload = setupAutocomplete;