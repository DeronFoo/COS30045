var w = 700;
var h = 500;

// Define the map projection centered on Southeast Asia
const projection = d3.geoMercator().center([117, 9]).translate([w / 2, h / 2]).scale(800);

// Define a path generator based on the projection
const path = d3.geoPath().projection(projection);

// Colour scale for temperature data (adjusted dynamically)
const tempColourScale = d3.scaleSequential(d3.interpolateReds).domain([0, 30]);  

// Radius scale for circles based on GHG emissions
const areaScale = d3.scaleSqrt().domain([0, 100]).range([0, 20]);

// Set up zoom behavior
const zoom = d3.zoom()
    .scaleExtent([1, 10])  // Minimum and maximum zoom levels
    .translateExtent([[-1000, -1000], [w + 1000, h + 1000]])  // Pan limits
    .on("zoom", (event) => {
        svgGroup.attr("transform", event.transform);  // Apply zoom and pan transformations
    });

// Create the SVG container for the map and set its dimensions
const svg = d3.select("#choropleth")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .call(zoom)  // Enable zooming and panning
    .on("dblclick.zoom", null);  // Disable double-click zooming if not needed

// Append a group element to apply transformations
const svgGroup = svg.append("g");

// Create a tooltip div, initially hidden
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background-color", "white")
    .style("border", "1px solid black")
    .style("border-radius", "5px")
    .style("display", "none");

// Transform the emissions data into long format
function transformData(data) {
    const emissions = [];
    data.forEach(d => {
        const country = d.Country;  // Extract the country
        // Loop over each year column and add to the emissions array
        for (const [year, value] of Object.entries(d)) {
            if (year !== 'Country') { // Skip the 'Country' column
                emissions.push({ country, year: +year, emission: +value });
            }
        }
    });
    return emissions;
}

// Pie chart creation function adjustment
function createPieChart(countryName) {
    const countryEmissions = emissionsComposition[countryName]; // Ensure correct source here

    if (!countryEmissions) {
        console.error("No emission data found for", countryName);
        return;
    }

    let emissionsData = [];
    for (let gas in countryEmissions) {
        for (let sector in countryEmissions[gas]) {
            emissionsData.push({
                label: `${sector} (${gas})`,
                value: countryEmissions[gas][sector]
            });
        }
    }

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const svg = d3.select("#pieChartContainer").html("").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const slices = svg.selectAll("path")
        .data(pie(emissionsData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10]) 
        .style("stroke", "white")
        .style("stroke-width", "2px");

    slices.append("title")
        .text(d => `${d.data.label}: ${d.data.value.toFixed(2)} Mt CO₂eq/yr`);
}



// Dummy emission composition data for each country
const emissionsComposition = {
    "Malaysia": {
        "CO2": {
            "Agriculture": 0.151904744,
            "Buildings": 0.40867669,
            "Fuel Exploitation": 0.43544168,
            "Industrial Combustion": 19.19790784,
            "Power Industry": 1.947927108,
            "Processes": 0.650966328,
            "Transport": 4.07975022,
            "Waste": 0.009991671
        },
        "CH4": {
            "Agriculture": 9.60352938,
            "Buildings": 0.23419963,
            "Fuel Exploitation": 1.710023473,
            "Industrial Combustion": 0.046494458,
            "Power Industry": 0.000860462,
            "Processes": 3.54816E-05,
            "Transport": 0.032311795,
            "Waste": 1.307029099
        },
        "F-gases": {
            "Processes": 0.000047
        },
        "N2O": {
            "Agriculture": 4.98678159,
            "Buildings": 0.026856234,
            "Fuel Exploitation": 0.009458758,
            "Industrial Combustion": 0.069579383,
            "Power Industry": 0.002398685,
            "Processes": 0.247904901,
            "Transport": 0.047892089,
            "Waste": 0.099148878
        }
    }
};

// Transform the temperature data into a map for easy access
function transformTempData(tempData) {
    const tempMap = new Map();
    tempData.forEach(d => {
        const country = d.Country;  // Extract the country
        const tempValues = Object.entries(d)
            .filter(([year, value]) => year !== "Country")
            .map(([year, value]) => ({ year: +year, temp: +value }));
        tempMap.set(country, tempValues);
    });
    return tempMap;
}

// Load GeoJSON and CSV data
Promise.all([
    d3.json("Choropleth/geomap.json"),
    d3.csv("Choropleth/GHG_by_country.csv", d3.autoType),
    d3.csv("Choropleth/temp.csv", d3.autoType)
]).then(([geoData, rawData, tempData]) => {
    // Transform emissions and temperature data
    const emissionsData = transformData(rawData);
    const emissionsMap = d3.group(emissionsData, d => d.country, d => d.year);

    // Transform temperature data
    const tempMap = transformTempData(tempData);

    // Set the color scale domain for temperature based on the data
    const minTemp = d3.min(tempData, d => d3.min(Object.values(d).slice(1), v => v));
    const maxTemp = d3.max(tempData, d => d3.max(Object.values(d).slice(1), v => v));
    tempColourScale.domain([minTemp, maxTemp]);

    // Draw the map with color based on temperature
    svgGroup.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
            const countryName = d.properties.name;
            const countryTempData = tempMap.get(countryName);
            const yearTempData = countryTempData ? countryTempData.find(d => d.year === 1970) : null;
            const temp = yearTempData ? yearTempData.temp : 0;  // Default to 0 if no temperature data is found
            return tempColourScale(temp); // Apply color scale based on temperature
        })
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
            d3.select(this)
            .attr("stroke-width", 3); // Increase border thickness on mouseover

            const countryName = d.properties.name;
            const countryTempData = tempMap.get(countryName);
            const yearTempData = countryTempData ? countryTempData.find(t => t.year === 1970) : null;
            const temp = yearTempData ? yearTempData.temp : "N/A";
            tooltip.style("display", "block")
                .html(`<strong>${countryName}</strong><br>Year: 1970<br>Temperature: ${temp}°C`);
        })
        .on("mousemove", function(event) {
            tooltip.style("top", `${event.pageY + 5}px`)
                .style("left", `${event.pageX + 5}px`);
        })
        .on("mouseout", function() {
            d3.select(this)
            .attr("stroke-width", 1); // Reset border thickness on mouseout

            tooltip.style("display", "none");
        });
    
    // Function to draw the legend
    function drawTemperatureLegend() {
        const legendHeight = 200; // Height of the legend
        const legendWidth = 20; // Width of the legend
        const legendMargin = { top: 10, right: 40, bottom: 10, left: 10 };

        // Create an SVG for the legend
        const legendSvg = d3.select("#choropleth")
            .append("svg")
            .attr("width", legendWidth + legendMargin.left + legendMargin.right)
            .attr("height", legendHeight + legendMargin.top + legendMargin.bottom)
            .attr("id", "tempLegend")
            .style("position", "absolute")
            .style("top", "20px") // Positioning at the top-right corner
            .style("right", "20px");

        // Create a group for the legend
        const legendGroup = legendSvg.append("g")
            .attr("transform", `translate(${legendMargin.left}, ${legendMargin.top})`);

        // Define the color scale for the legend
        const legendScale = d3.scaleLinear()
            .domain([21, 28])
            .range([legendHeight, 0]);

        // Add a gradient to represent the temperature color scale
        const legendGradient = legendGroup.append("defs")
            .append("linearGradient")
            .attr("id", "tempGradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");

        // Define the color stops for the gradient
        legendGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", tempColourScale(minTemp));
        legendGradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", tempColourScale((minTemp+maxTemp)/2));
        legendGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", tempColourScale(maxTemp));

        // Draw the color bar for the legend
        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#tempGradient)");

        // Add an axis to the legend for temperature labels
        const legendAxis = d3.axisRight(legendScale)
            .ticks(6) // Number of ticks for easier reading
            .tickSize(6) // Add size to ticks to ensure they are visible
            .tickFormat(d => `${d}°C`); // Format tick labels with °C

        legendGroup.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${legendWidth}, 0)`)
            .call(legendAxis);
        
        // Adjust the position of the axis labels if necessary
        d3.selectAll(".axis text")
            .style("font-size", "12px")  // Increase font size for readability
            .style("text-anchor", "middle") // Center-align the text
            .attr("transform", `translate(12, 0)`);
    }

    // Call the legend function to render the temperature legend
    drawTemperatureLegend();

    function updateMapColors(year) {
        svgGroup.selectAll("path")
            .data(geoData.features)
            .attr("fill", d => {
                const countryName = d.properties.name;
                const countryTempData = tempMap.get(countryName);
                const yearTempData = countryTempData ? countryTempData.find(d => d.year === year) : null; // Dynamic year selection
                const temp = yearTempData ? yearTempData.temp : 0;  // Default to 0 if no temperature data is found
                return tempColourScale(temp); // Apply color scale based on temperature
            })
            .attr("stroke", "#333")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                d3.select(this)
                .attr("stroke-width", 3); // Increase border thickness on mouseover
    
                const countryName = d.properties.name;
                const countryTempData = tempMap.get(countryName);
                const yearTempData = countryTempData ? countryTempData.find(t => t.year === year) : null;
                const temp = yearTempData ? yearTempData.temp : "N/A";
                tooltip.style("display", "block")
                    .html(`<strong>${countryName}</strong><br>Year: ${year}<br>Temperature: ${temp}°C`);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", `${event.pageY + 5}px`)
                    .style("left", `${event.pageX + 5}px`);
            })
            .on("mouseout", function() {
                d3.select(this)
                .attr("stroke-width", 1); // Reset border thickness on mouseout
    
                tooltip.style("display", "none");
            });
    
    }

    // Function to update circles based on year and GHG emissions
    function updateCircles(year) {
        const circles = svgGroup.selectAll("circle")
            .data(geoData.features);

        circles.enter()
            .append("circle")
            .merge(circles)
            .attr("cx", d => path.centroid(d)[0])
            .attr("cy", d => path.centroid(d)[1])
            .attr("r", d => {
                const countryData = emissionsMap.get(d.properties.name); // Get country emissions data
                const yearData = countryData ? countryData.get(year) : null;
                const emission = yearData ? yearData[0].emission : 0; // Access the first item in the array
                return areaScale(emission); // Size the circles based on the emission value
            })
            .attr("fill", "cyan")
            .attr("opacity", 0.6)
            .on("mouseover", function(event, d) {
                const countryName = d.properties.name;
                const countryData = emissionsMap.get(countryName);
                const yearData = countryData ? countryData.get(year) : null;
                const emission = yearData ? yearData[0].emission : "N/A";
                tooltip.style("display", "block")
                    .html(`<strong>${countryName}</strong><br>Year: ${year}<br>GHG Emission: ${emission} Mt CO₂eq/yr`);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", `${event.pageY + 5}px`)
                    .style("left", `${event.pageX + 5}px`);
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            })
            .on("click", function(event, d) {
                const countryName = d.properties.name; // Get country name from the clicked circle
                createPieChart(countryName); // Create pie chart for the country
            });


        circles.exit().remove();
        
        // Update map colors based on the selected year
        updateMapColors(year);
    }

    // Initialize circles for the first year (1970)
    updateCircles(1970);

    // Optional: Add slider to update year and update circles
    d3.select("#timeSlider").on("input", function () {
        const year = +this.value;
        d3.select("#yearLabel").text(year);
        updateCircles(year);
    });
}).catch(error => console.error("Error loading data:", error));

