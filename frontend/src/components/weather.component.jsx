import { useEffect, useState } from "react"
import axios from "axios"
import { getWeatherCondition, translate } from "../common/weather"
import Loader from "./loader.component"
import { getTime } from "../common/date"

const WeatherComponent = () => {

    const [weather, setWeather] = useState(null)
    const [weatherIcon, setWeatherIcon] = useState('')

    useEffect(() => {
        getWeather()
    }, [])

    useEffect(() => {
        const weatherState = getWeatherCondition(weather)

        if (weatherState === 'unknown') {
            return
        }

        switch (weatherState) {
            case 'hazy': setWeatherIcon('fi-bs-smog'); break
            case 'sunny': setWeatherIcon('fi-br-sun'); break
            case 'raining': setWeatherIcon('fi-sr-cloud-showers'); break
            case 'thunderstorm': setWeatherIcon('fi-sr-thunderstorm'); break
        }
    }, [weather])

    const getWeather = () => {
        axios.get('https://api.data.gov.my/weather/forecast?contains=Tn139@location__location_id')
            .then(({ data }) => {
                const weatherToday = data[data.length - 1]
                const currentTime = getTime(new Date())

                switch (currentTime) {
                    case 'morning': setWeather(weatherToday.morning_forecast); break
                    case 'afternoon': setWeather(weatherToday.afternoon_forecast); break
                    case 'night': setWeather(weatherToday.night_forecast); break
                }
            })
            .catch(err => console.error(err))
    }

    return (
        <>
            <div className="flex flex-col items-center my-4">
                <i className={`fi ${weatherIcon} text-5xl`}></i>
                <p className="text-xl">
                    <>
                        {
                            weather === null ? "Loading..." : translate(weather)
                        }
                    </>
                </p>
            </div>
        </>
    )
}

export default WeatherComponent