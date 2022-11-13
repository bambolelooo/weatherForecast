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
        if (cityDataMap.get(city)) {
            console.log(cityDataMap.get(city));
            fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${
                    cityDataMap.get(city).lat
                }&lon=${cityDataMap.get(city).lon}&appid=${apiKey}&units=metric`
            )
                .then((response) => response.json())
                .then((data) => {
                    console.log(data);
                    //fill divs
                    parseFutureWeather(data);
                });
        } else {
            fetch(
                `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`
            )
                .then((response) => response.json())
                .then((data) => {
                    cityDataMap.set(data[0].name, {
                        lat: data[0].lat,
                        lon: data[0].lon,
                    });
                    console.log(cityDataMap.get(data[0].name));
                    localStorage.setItem(
                        "cityDataMap",
                        JSON.stringify(Array.from(cityDataMap.entries()))
                    );
                    fetch(
                        `https://api.openweathermap.org/data/2.5/forecast?lat=${
                            cityDataMap.get(data[0].name).lat
                        }&lon=${
                            cityDataMap.get(data[0].name).lon
                        }&appid=${apiKey}&units=metric`
                    )
                        .then((response) => response.json())
                        .then((data) => {
                            console.log(data);
                            parseFutureWeather(data);
                        });
                });
        }
    });
});

function parseFutureWeather(data) {
    const bestTime = String(13 - data.city.timezone / 3600);
    for (const weather of data.list) {
        if (weather.dt_txt.slice(11, 13) === bestTime) {
            console.log(weather);
        }
    }
}
