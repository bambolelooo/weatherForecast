$(function () {
    // let weatherPads = querySelectorAll(".weather");

    // const coordinates = new Map();
    let apiKey = "baec5973b080a8881020312f4acc7843";

    const cityDataMap =
        new Map(JSON.parse(localStorage.getItem("cityDataMap"))) || new Map();
    const cities = [...cityDataMap.keys()];
    $("#cities").autocomplete({
        source: cities,
    });

    $(".cityBtn").click(function () {
        const city = $(this).text().trim();
        fetchCity(city);
    });

    function fetchCity(city) {
        const currDate = new Date();
        // if difference between current time and last stored data is less than 3h - dont fetch
        if (
            cityDataMap.get(city) &&
            (cityDataMap.get(city).current.dt * 1000 - currDate.getTime()) /
                3600000 <
                3
        ) {
            //TODO: Fill divs
            console.log(
                (cityDataMap.get(city).current.dt * 1000 - currDate.getTime()) /
                    3600000
            );
        } else if (cityDataMap.get(city)) {
            console.log(cityDataMap.get(city));
            fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${
                    cityDataMap.get(city).lat
                }&lon=${cityDataMap.get(city).lon}&appid=${apiKey}&units=metric`
            )
                .then((response) => response.json())
                .then((data) => {
                    console.log(data);
                    parseWeather(data, city);
                });
        } else {
            fetch(
                `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`
            )
                .then((response) => response.json())
                .then((data) => {
                    let cityName = data[0].name;
                    cityDataMap.set(cityName, {
                        lat: data[0].lat,
                        lon: data[0].lon,
                    });
                    console.log(cityDataMap.get(cityName));
                    localStorage.setItem(
                        "cityDataMap",
                        JSON.stringify(Array.from(cityDataMap.entries()))
                    );
                    fetch(
                        `https://api.openweathermap.org/data/2.5/forecast?lat=${
                            cityDataMap.get(cityName).lat
                        }&lon=${
                            cityDataMap.get(cityName).lon
                        }&appid=${apiKey}&units=metric`
                    )
                        .then((response) => response.json())
                        .then((data) => {
                            console.log(data);
                            console.log(cityName);
                            parseWeather(data, cityName);
                        });
                });
        }
    }

    function parseWeather(data, cityName) {
        const bestTime = String(13 - data.city.timezone / 3600); // best time to present weather
        const weatherStats = {};
        let counter = 1;
        for (const weather of data.list) {
            weatherStats.current = data.list[0];
            if (data.list[0].dt_txt.slice(11, 13) === bestTime) {
                // skip if current time is best
            } else if (weather.dt_txt.slice(11, 13) === bestTime) {
                weatherStats[`day${counter}`] = weather;
                counter++;
            }
        }

        // xD
        const weatherStatsClone = JSON.parse(JSON.stringify(weatherStats));
        counter = 1;
        cityDataMap.set(cityName, {
            ...cityDataMap.get(cityName),
            ...weatherStatsClone,
        });
        localStorage.setItem(
            "cityDataMap",
            JSON.stringify(Array.from(cityDataMap.entries()))
        );
        console.log(cityDataMap.get(cityName));
    }

    function fillDivs(city) {
        $(".city").text(city);
        const mainWeather = cityDataMap.get(city).current.weather[0].main;
        const currentIcon = cityDataMap.get(city).current.weather[0].icon;
        $(".today").html(`
        <div class="weather rounded-4 night d-flex justify-content-between align-items-center px-3 overflow-hidden">
        Today
        <img src="./img/${
            mainWeather === "Rain"
                ? "rainy"
                : currentIcon === "01d"
                ? "day"
                : currentIcon === "01n"
                ? "night"
                : mainWeather === "Clouds"
                ? "cloudy"
                : mainWeather === "Snow"
                ? "snowy"
                : mainWeather === "Thunderstorm"
                ? "thunder"
                : "cloudy"
        }.svg" alt="rainy" />
        </div>
        `);
    }
});
