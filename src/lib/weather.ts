export interface WeatherData {
  city: string;
  temperatureC: number;
  apparentTempC: number;
  condition: string;
  isRaining: boolean;
  windSpeedKmH: number;
  humidityPercent: number;
  recommendation: string;
}

// Weather code mapping from WMO standard
function parseWmoCode(code: number): { condition: string; isRaining: boolean } {
  if (code === 0) return { condition: "Clear Sky", isRaining: false };
  if (code >= 1 && code <= 3) return { condition: "Partly Cloudy", isRaining: false };
  if (code >= 45 && code <= 48) return { condition: "Foggy", isRaining: false };
  if (code >= 51 && code <= 67) return { condition: "Rain / Drizzle", isRaining: true };
  if (code >= 71 && code <= 77) return { condition: "Snowfall", isRaining: true };
  if (code >= 80 && code <= 82) return { condition: "Rain Showers", isRaining: true };
  if (code >= 95) return { condition: "Thunderstorm", isRaining: true };
  return { condition: "Overcast", isRaining: false };
}

/**
 * Fetches real-time weather for any city globally via Open-Meteo.
 * Does not require an API key.
 */
export async function getCityWeather(cityName: string = "New York"): Promise<WeatherData> {
  try {
    // 1. Geocode city name to lat/lon
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cityName
    )}&count=1&language=en&format=json`;

    const geoRes = await fetch(geoUrl, { next: { revalidate: 3600 } });
    if (!geoRes.ok) throw new Error("Geocoding failed");

    const geoData = await geoRes.json();
    const location = geoData.results?.[0];

    const lat = location ? location.latitude : 40.7128;
    const lon = location ? location.longitude : -74.006;
    const resolvedName = location ? `${location.name}, ${location.country_code || ""}` : cityName;

    // 2. Fetch current forecast
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m`;

    const weatherRes = await fetch(forecastUrl, { next: { revalidate: 1800 } });
    if (!weatherRes.ok) throw new Error("Weather forecast fetch failed");

    const weatherJson = await weatherRes.json();
    const current = weatherJson.current;

    const temp = Math.round(current.temperature_2m);
    const apparent = Math.round(current.apparent_temperature);
    const { condition, isRaining } = parseWmoCode(current.weather_code);

    let recommendation = "Mild conditions: light jacket or layering recommended.";
    if (temp < 10) {
      recommendation = "Chilly weather: insulated coat, knitwear, and closed footwear recommended.";
    } else if (temp > 24) {
      recommendation = "Warm & sunny: breathable linen, lightweight cotton, and sunglasses suggested.";
    }
    if (isRaining) {
      recommendation += " Bring water-resistant outer layer and avoid untreated suede shoes.";
    }

    return {
      city: resolvedName.trim(),
      temperatureC: temp,
      apparentTempC: apparent,
      condition,
      isRaining: isRaining || current.precipitation > 0,
      windSpeedKmH: Math.round(current.wind_speed_10m || 0),
      humidityPercent: Math.round(current.relative_humidity_2m || 50),
      recommendation,
    };
  } catch (err) {
    console.warn("Weather fetch fallback to default mild spring day:", err);
    return {
      city: cityName,
      temperatureC: 19,
      apparentTempC: 19,
      condition: "Pleasant & Clear",
      isRaining: false,
      windSpeedKmH: 10,
      humidityPercent: 45,
      recommendation: "Comfortable weather: ideal for layered tops and smart casual pieces.",
    };
  }
}
