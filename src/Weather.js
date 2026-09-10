import { useRef, useState, useEffect } from "react";
import axios from "axios";

function Weather() {
    const rCity = useRef();

    const [city, setCity] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [forecast, setForecast] = useState([]);
    const [isListening, setIsListening] = useState(false);

    // Focus city input when page loads
    useEffect(() => {
        if (rCity.current) {
            rCity.current.focus();
        }
    }, []);

    // Handle manual city input
    const hCity = (event) => {
        setCity(event.target.value);
    };

    // ==========================================
    // 🎤 VOICE INPUT
    // ==========================================
    const handleVoiceInput = () => {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert(
                "Speech recognition is not supported in this browser. Please use Google Chrome."
            );
            return;
        }

        const recognition = new SpeechRecognition();

        // Indian English
        recognition.lang = "en-IN";

        // Stop after the user finishes speaking
        recognition.continuous = false;

        // Only return final result
        recognition.interimResults = false;

        // Maximum alternatives
        recognition.maxAlternatives = 1;

        // ------------------------------------------
        // Recognition started
        // ------------------------------------------
        recognition.onstart = () => {
            console.log("🎤 Listening...");

            setIsListening(true);
            setMsg("🎤 Listening... Speak the city name.");
        };

        // ------------------------------------------
        // Speech recognized
        // ------------------------------------------
        recognition.onresult = (event) => {
            let spokenCity =
                event.results[0][0].transcript.trim();

            console.log("Recognized speech:", spokenCity);

            // Remove final punctuation
            spokenCity = spokenCity.replace(/[.,!?]+$/, "");

            setCity(spokenCity);
            setMsg("");

            setIsListening(false);

            // Put focus back on input
            if (rCity.current) {
                rCity.current.focus();
            }
        };

        // ------------------------------------------
        // Recognition error
        // ------------------------------------------
        recognition.onerror = (event) => {
            console.error(
                "Speech recognition error:",
                event.error
            );

            setIsListening(false);

            if (event.error === "not-allowed") {
                alert(
                    "Microphone permission was denied. Please allow microphone access for localhost in Chrome."
                );
            } else if (event.error === "no-speech") {
                alert(
                    "No speech detected. Please click the microphone and speak clearly."
                );
            } else if (event.error === "audio-capture") {
                alert(
                    "No microphone was detected. Please check your microphone connection."
                );
            } else if (event.error === "network") {
                alert(
                    "Network error occurred during speech recognition."
                );
            } else {
                alert(
                    "Voice recognition error: " + event.error
                );
            }
        };

        // ------------------------------------------
        // Recognition ended
        // ------------------------------------------
        recognition.onend = () => {
            console.log("🎤 Speech recognition ended");
            setIsListening(false);
        };

        // Start recognition
        try {
            recognition.start();
        } catch (error) {
            console.error(
                "Could not start speech recognition:",
                error
            );

            setIsListening(false);
        }
    };

    // ==========================================
    // 🌤️ FETCH WEATHER
    // ==========================================
    const handleSubmit = async (event) => {
        event.preventDefault();

        const btnName =
            event.nativeEvent.submitter?.name;

        // ------------------------------------------
        // Find Weather
        // ------------------------------------------
        if (btnName === "btnTranslate") {
            if (city.trim() === "") {
                alert("Please enter a city name.");

                setMsg("");
                setForecast([]);

                if (rCity.current) {
                    rCity.current.focus();
                }

                return;
            }

            const current_key =
    process.env.REACT_APP_WEATHER_API_KEY;

const forecast_key =
    process.env.REACT_APP_FORECAST_API_KEY;;

            setLoading(true);
            setMsg("Loading weather data...");
            setForecast([]);

            // ------------------------------------------
            // Current Weather API
            // ------------------------------------------
            const url =
                `https://api.openweathermap.org/data/2.5/weather` +
                `?q=${encodeURIComponent(city)}` +
                `&appid=${current_key}` +
                `&units=metric` +
                `&lang=en`;

            try {
                const res = await axios.get(url);

                const temp = res.data.main.temp;

                const desc =
                    res.data.weather[0].description;

                const humidity =
                    res.data.main.humidity;

                const wind =
                    res.data.wind.speed;

                const now =
                    new Date().toLocaleTimeString();

                // Display weather information
                setMsg(
                    `Temperature: ${temp}°C\n` +
                    `Condition: ${desc}\n` +
                    `Humidity: ${humidity}%\n` +
                    `Wind: ${wind} m/s\n` +
                    `Updated at: ${now}`
                );

                // ------------------------------------------
                // Change background based on weather
                // ------------------------------------------
                const weatherType =
                    res.data.weather[0].main.toLowerCase();

                if (weatherType.includes("rain")) {
                    document.body.style.background =
                        "#a0aec0";
                } else if (temp <= 20) {
                    document.body.style.background =
                        "#bee3f8";
                } else if (temp >= 30) {
                    document.body.style.background =
                        "#f6e05e";
                } else {
                    document.body.style.background =
                        "#d3f9d8";
                }

                // ------------------------------------------
                // 5-DAY FORECAST
                // ------------------------------------------
                const forecastUrl =
                    `https://api.openweathermap.org/data/2.5/forecast` +
                    `?q=${encodeURIComponent(city)}` +
                    `&appid=${forecast_key}` +
                    `&units=metric`;

                try {
                    const forecastRes =
                        await axios.get(forecastUrl);

                    if (
                        !forecastRes.data ||
                        !forecastRes.data.list
                    ) {
                        setForecast([]);
                        setLoading(false);
                        return;
                    }

                    const dailyData = {};

                    forecastRes.data.list.forEach(
                        (item) => {
                            const dateStr =
                                item.dt_txt.split(" ")[0];

                            const dateObj =
                                new Date(dateStr);

                            const dayName =
                                dateObj.toLocaleDateString(
                                    "en-US",
                                    {
                                        weekday: "long",
                                    }
                                );

                            if (!dailyData[dayName]) {
                                dailyData[dayName] = {
                                    min:
                                        item.main.temp_min,

                                    max:
                                        item.main.temp_max,

                                    description:
                                        item.weather[0]
                                            .description,
                                };
                            } else {
                                dailyData[dayName].min =
                                    Math.min(
                                        dailyData[dayName].min,
                                        item.main.temp_min
                                    );

                                dailyData[dayName].max =
                                    Math.max(
                                        dailyData[dayName].max,
                                        item.main.temp_max
                                    );
                            }
                        }
                    );

                    const fiveDayForecast =
                        Object.entries(dailyData)
                            .slice(0, 5)
                            .map(
                                ([day, val]) => ({
                                    day,
                                    ...val,
                                })
                            );

                    setForecast(fiveDayForecast);
                    setLoading(false);
                } catch (forecastError) {
                    console.error(
                        "Forecast error:",
                        forecastError
                    );

                    setForecast([]);
                    setLoading(false);
                }
            } catch (error) {
                console.error(
                    "Weather fetch error:",
                    error
                );

                setMsg("❌ City not found.");
                setForecast([]);
                setLoading(false);
            }
        }

        // ==========================================
        // 🔊 READ ALOUD
        // ==========================================
        else if (btnName === "btnReadAloud") {
            if (msg === "") {
                alert("Nothing to speak.");

                if (rCity.current) {
                    rCity.current.focus();
                }

                return;
            }

            if ("speechSynthesis" in window) {
                // Stop any previous speech
                window.speechSynthesis.cancel();

                const textToSpeak =
                    msg.replace(/❌/g, "");

                const speech =
                    new SpeechSynthesisUtterance(
                        textToSpeak
                    );

                speech.lang = "en-IN";
                speech.pitch = 1;
                speech.rate = 1;
                speech.volume = 1;

                window.speechSynthesis.speak(
                    speech
                );
            } else {
                alert(
                    "Speech synthesis is not supported in this browser."
                );
            }
        }

        // ==========================================
        // 🧹 CLEAR
        // ==========================================
        else if (btnName === "btnClear") {
            setCity("");
            setMsg("");
            setForecast([]);
            setLoading(false);
            setIsListening(false);

            // Reset background
            document.body.style.background = "";

            if (rCity.current) {
                rCity.current.focus();
            }
        }
    };

    // ==========================================
    // 🎨 UI
    // ==========================================
    return (
        <div className="weather-container">

            <h1>Weather Forecast</h1>

            <br />

            <form onSubmit={handleSubmit}>

                {/* City input */}
                <input
                    type="text"
                    placeholder="Enter city name"
                    value={city}
                    onChange={hCity}
                    ref={rCity}
                />

                {/* 🎤 Microphone */}
                <button
                    type="button"
                    onClick={handleVoiceInput}
                    className="voice-btn"
                    disabled={isListening}
                    title="Speak city name"
                >
                    {isListening ? "🎤" : "🎙️"}
                </button>

                {/* Find Weather */}
                <input
                    type="submit"
                    name="btnTranslate"
                    value="Find Weather"
                />

                {/* Read Aloud */}
                <input
                    type="submit"
                    name="btnReadAloud"
                    value="🔊"
                />

                {/* Clear */}
                <input
                    type="submit"
                    name="btnClear"
                    value="Clear"
                />

            </form>

            <br />

            {/* Loading */}
            {loading && (
                <p className="loading-text">
                    Loading weather data...
                </p>
            )}

            {/* Listening */}
            {isListening && (
                <p className="listening-text">
                    
                </p>
            )}

            {/* Current weather */}
            {!loading && msg && (
                <h2 className="weather-msg">

                    {msg
                        .split("\n")
                        .map((line, index) => (
                            <div key={index}>
                                {line}
                            </div>
                        ))}

                    {/* ==================================
                        5-DAY FORECAST
                    ================================== */}

                    {forecast.length > 0 && (
                        <div className="forecast">

                            <h3>
                                5-Day Forecast
                            </h3>

                            <ul>
                                {forecast.map(
                                    (day, idx) => (
                                        <li key={idx}>

                                            <strong>
                                                {day.day}
                                            </strong>

                                            {" – "}

                                            {day.description}

                                            {", Min: "}

                                            {day.min.toFixed(
                                                1
                                            )}

                                            °C / Max:{" "}

                                            {day.max.toFixed(
                                                1
                                            )}

                                            °C

                                        </li>
                                    )
                                )}
                            </ul>

                        </div>
                    )}

                </h2>
            )}

        </div>
    );
}

export default Weather;