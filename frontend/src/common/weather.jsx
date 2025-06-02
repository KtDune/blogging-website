const forecastEnglish = {
    "Berjerebu": "Hazy",
    "Tiada hujan": "Sunny",
    "Hujan": "Rain",
    "Hujan di beberapa tempat": "Scattered rain",
    "Hujan di satu dua tempat": "Isolated Rain",
    "Hujan di satu dua tempat di kawasan pantai": "Isolated rain over coastal areas",
    "Hujan di satu dua tempat di kawasan pedalaman": "Isolated rain over inland areas",
    "Ribut petir": "Thunderstorms",
    "Ribut petir di beberapa tempat": "Scattered thunderstorms",
    "Ribut petir di beberapa tempat di kawasan pedalaman": "Scattered thunderstorms over inland areas",
    "Ribut petir di satu dua tempat": "Isolated thunderstorms",
    "Ribut petir di satu dua tempat di kawasan pantai": "Isolated thunderstorms over coastal areas",
    "Ribut petir di satu dua tempat di kawasan pedalaman": "Isolated thunderstorms over inland areas"
}

export const translate = (forecast) => forecastEnglish[forecast] || ''

export const getWeatherCondition = (weatherString) => {

    if (!weatherString) {
        return 'unknown'
    }

    const englishForecast = forecastEnglish[weatherString]

    // Check for hazy condition
    if (englishForecast.toLowerCase().includes('hazy')) {
        return 'hazy';
    }

    if (englishForecast.toLowerCase().includes('thunderstorms')) {
        return 'thunderstorm';
    }

    // Check for raining condition
    if (englishForecast.toLowerCase().includes('rain')) {
        return 'raining';
    }

    // Check for sunny condition
    if (englishForecast.toLowerCase().includes('sunny')) {
        return 'sunny';
    }
    return 'unknown';
}