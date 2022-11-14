"use strict";
$(function () {
    //pls dont steal it :)
    let apiKey = "baec5973b080a8881020312f4acc7843";

    //map of all cities and weather
    const cityDataMap =
        new Map(JSON.parse(localStorage.getItem("cityDataMap"))) || new Map();
    let cities = [...cityDataMap.keys()];

    // updates navbar with sotred cities and adds listeners to them
    function fillNavbar() {
        cities = [...cityDataMap.keys()];
        $("#sidebar-nav").html(
            `<form class="mx-2 my-2">
        <div class="form-group">
            <input
                type="text"
                class="form-control"
                id="cities"
            />
        </div>
        </form> <button
        class="btn btn-outline-secondary m-2 search"
        type="button">
        Search city
        </button>`
        );
        for (const city of cities) {
            $("#sidebar-nav").append(`<button
                                    class="list-group-item border-end-0 d-inline-block cityBtn"
                                    data-bs-parent="#sidebar"
                                >
                                ${city}
                                </button>`);
        }

        $(".search").click(function () {
            const city = $("#cities").val();
            fetchCity(city);
        });
        $(".cityBtn").click(function () {
            const city = $(this).text().trim();
            fetchCity(city);
        });
        $("#cities").autocomplete({
            source: cities,
        });
    }
    fillNavbar();

    //initial set with first searched cuty
    if (cities.length != 0) {
        fillDivs(cities[0]);
    }

    // huge function to fetch city
    function fetchCity(city) {
        const currDate = new Date();
        // if difference between current time and last stored data is less than 2h - don't fetch
        if (
            cityDataMap.get(city) &&
            Math.abs(
                (cityDataMap.get(city).current.dt * 1000 - currDate.getTime()) /
                    3600000
            ) < 2
        ) {
            fillDivs(city);

            //if city weather data is outdated fetch new
        } else if (cityDataMap.get(city)) {
            fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${
                    cityDataMap.get(city).lat
                }&lon=${cityDataMap.get(city).lon}&appid=${apiKey}&units=metric`
            )
                .then((response) => response.json())
                .then((data) => {
                    // console.log(data);
                    parseWeather(data, city);
                    fillDivs(city);
                });
        } else if (city.length === 0) {
            $("#cities").val("Empty input");

            //if this is a new city lookup for it and fetch
        } else {
            //fetch location
            fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`
            )
                .then((response) => response.json())
                .then((data) => {
                    if (data.length === 0) {
                        $("#cities").val("Couldn't find");
                    } else {
                        let cityName = data[0].name;
                        cityDataMap.set(cityName, {
                            lat: data[0].lat,
                            lon: data[0].lon,
                        });
                        fillNavbar();

                        localStorage.setItem(
                            "cityDataMap",
                            JSON.stringify(Array.from(cityDataMap.entries()))
                        );
                        // fetch weather
                        fetch(
                            `https://api.openweathermap.org/data/2.5/forecast?lat=${
                                cityDataMap.get(cityName).lat
                            }&lon=${
                                cityDataMap.get(cityName).lon
                            }&appid=${apiKey}&units=metric`
                        )
                            .then((response) => response.json())
                            .then((data) => {
                                // console.log(data);
                                // console.log(cityName);
                                parseWeather(data, cityName);
                                fillDivs(cityName);
                            });
                    }
                });
        }
    }

    // filter unused weather data
    function parseWeather(data, cityName) {
        let bestTime = Math.floor(13 - data.city.timezone / 3600); // best time to present weather
        while (bestTime % 3 !== 0) {
            bestTime += 1;
        }
        const weatherStats = {};
        let counter = 1;
        weatherStats.localHours = new Date(
            new Date().getTime() + data.city.timezone * 1000
        ).getUTCHours();
        weatherStats.current = data.list[0];
        for (const weather of data.list) {
            if (data.list[0].dt_txt.slice(11, 13) == bestTime) {
                data.list[0].dt_txt = "skipped";
            } else if (Number(weather.dt_txt.slice(11, 13)) === bestTime) {
                weatherStats[`day${counter}`] = weather;
                counter++;
            }
        }
        if (counter < 6) {
            // correct acconrding to timezone
            bestTime = bestTime - 3;
            weatherStats[`day${counter}`] = data.list[39];
        }

        // genius way to make a deep copy of an object xD
        const weatherStatsClone = JSON.parse(JSON.stringify(weatherStats));
        counter = 1;
        cityDataMap.set(cityName, {
            ...cityDataMap.get(cityName),
            ...weatherStatsClone,
        });

        //set city in localstorage
        localStorage.setItem(
            "cityDataMap",
            JSON.stringify(Array.from(cityDataMap.entries()))
        );
    }

    //function to fill weather in divs
    //very scary idk how it works but it works just fine
    function fillDivs(city) {
        $(".city").text(city);
        const data = cityDataMap.get(city);
        const currentMainWeather = data.current.weather[0].main;
        const currentIcon = data.current.weather[0].icon;
        const currentHours = data.localHours;
        const dayNight =
            currentHours > 18 || currentHours < 6 ? "night" : "day";
        const currentTemp = Math.round(data.current.main.temp);
        $(".today").html(`
        <div class="weather rounded-4 ${
            dayNight === "day" && currentTemp > 10
                ? "day"
                : dayNight === "day" && currentTemp < 10
                ? "cold"
                : "night"
        } d-flex justify-content-between align-items-center px-3 overflow-hidden text-center py-2">
        Today<br>
        Temperature: ${currentTemp}°C<br>
        Wind speed: ${Math.round(data.current.wind.speed)} m/s<br>
        Humidity: ${data.current.main.humidity}%
        <img src="./img/${
            currentMainWeather === "Rain"
                ? "rainy"
                : currentIcon === "01d"
                ? "day"
                : currentIcon === "01n"
                ? "night"
                : currentMainWeather === "Clouds"
                ? "cloudy"
                : currentMainWeather === "Snow"
                ? "snowy"
                : currentMainWeather === "Thunderstorm"
                ? "thunder"
                : "cloudy"
        }.svg"/>
        </div>
        `);
        for (let i = 1; i <= 5; i++) {
            const dayMainWeather = data[`day${i}`].weather[0].main;
            const dayIcon = data[`day${i}`].weather[0].icon;
            const dayTemp = Math.round(data[`day${i}`].main.temp);
            $(`.day${i}`).html(`
            <div
            class="weather rounded-4 ${
                dayTemp > 10 ? "day" : "cold"
            } d-flex justify-content-between align-items-center p-3 my-3 overflow-hidden">
            ${data[`day${i}`].dt_txt.slice(0, 11)} <br>
            Temperature: ${dayTemp}°C<br>
        Wind speed: ${Math.round(data[`day${i}`].wind.speed)} m/s<br>
        Humidity: ${data[`day${i}`].main.humidity}%
        <img src="./img/${
            dayMainWeather === "Rain"
                ? "rainy"
                : dayIcon === "01d"
                ? "day"
                : dayMainWeather === "Clouds"
                ? "cloudy"
                : dayMainWeather === "Snow"
                ? "snowy"
                : dayMainWeather === "Thunderstorm"
                ? "thunder"
                : "cloudy"
        }.svg"/>
            </div>
            `);
        }
    }
});
