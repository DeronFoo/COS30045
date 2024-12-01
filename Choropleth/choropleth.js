var w = 700;
var h = 530;

// Define the map projection centered on Southeast Asia
const projection = d3.geoMercator().center([117, 9]).translate([w / 2, h / 2]).scale(800);

// Define a path generator based on the projection
const path = d3.geoPath().projection(projection);

// Colour scale for DALYs data (adjusted dynamically)
const dalysColourScale = d3.scaleSequential(d3.interpolateReds).domain([0, 15]);  

// Radius scale for circles based on PM2.5 exposure
const areaScale = d3.scaleSqrt().domain([0, 42]).range([0, 42]);

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

// Transform the exposures data into long format
function transformData(data) {
    const exposures = [];
    data.forEach(d => {
        const country = d.Country;  // Extract the country
        // Loop over each year column and add to the exposures array
        for (const [year, value] of Object.entries(d)) {
            if (year !== 'Country') { // Skip the 'Country' column
                exposures.push({ country, year: +year, concentration: +value });
            }
        }
    });
    return exposures;
}

function createPieChartFromCSV(countryName, year) {
    // Construct the CSV file path
    const csvFilePath = `Choropleth/levels/${countryName}.csv`;

    // Load the CSV file
    d3.csv(csvFilePath, d3.autoType).then(data => {
        if (!data || data.length === 0) {
            console.error("No data found in CSV for", countryName);
            return;
        }

        // Transform exposure level data
        const levelMap = transformLevelData(data);

        // Prepare the exposure level data for the given year
        const exposureLevelData = Array.from(levelMap.entries()).map(([level, values]) => {
            const yearData = values.find(d => d.year === year); // Find data for the specified year
            return {
                label: level, // Level name
                value: yearData ? yearData.level : 0 // Value for the year or 0 if not found
            };
        }).filter(d => d.value > 0); // Remove levels with 0 exposure

        if (exposureLevelData.length === 0) {
            console.error(`No data found for the year ${year}.`);
            return;
        }

        // Pie chart dimensions
        const width = 250;
        const height = 120;
        const radius = Math.min(120, 120) / 2;

        // Fixed shades of blue for the 5 exposure categories (darkest for highest concentration)
        const colourScale = {
            '5to10': 'rgb(200,255,255)',  // Lightest blue for the lowest exposure
            '10to15': 'rgb(128,255,255)',
            '15to25': 'rgb(0,255,255)',
            '25to35': 'rgb(0,148,148)',
            '>35': 'rgb(0,82,82)' // Darkest blue for the highest exposure
        };

        // Clear existing chart and create SVG container
        const svg = d3.select("#pieChartContainer").html("").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${60}, ${height / 2})`);

        // Create pie chart
        const pie = d3.pie().value(d => d.value);
        const arc = d3.arc().innerRadius(0).outerRadius(radius);

        // Generate pie slices
        const slices = svg.selectAll("path")
            .data(pie(exposureLevelData)) // Use exposureLevelData here
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => colourScale[d.data.label]) // Use colourScale based on the exposure level
            .style("stroke", "white")
            .style("stroke-width", "2px");

        // Add tooltips to slices
        slices.append("title")
            .text(d => `${d.data.label}: ${d.data.value.toFixed(2)} µg/m³`);

        // Add Legend
        addPieLegend(svg, colourScale);  // Pass svg here
    });
}

function addPieLegend(svg, colourScale) {
    console.log("Adding pie");
    // Add Legend
    const legendContainer = svg.append("g")
        .attr("transform", `translate(${ 80 }, -60)`); // Position the legend to the right of the chart

    const legendLabels = ['5to10', '10to15', '15to25', '25to35', '>35'];
    const legendRanges = {
        '5to10': '0 - 10 µg/m³',
        '10to15': '10 - 15 µg/m³',
        '15to25': '15 - 25 µg/m³',
        '25to35': '25 - 35 µg/m³',
        '>35': '>35 µg/m³'
    };

    legendLabels.forEach((label, i) => {
        const legendItem = legendContainer.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        // Add colored rectangle (legend color)
        legendItem.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colourScale[label]); // Color based on the exposure level

        // Add label text (legend label)
        legendItem.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .attr("dy", ".35em") // Slightly shift up the legend text (adjust as needed)
            .text(`${legendRanges[label]}`);
    });
}

// Transform the DALYs data into a map for easy access
function transformDalysData(dalysData) {
    const dalysMap = new Map();
    dalysData.forEach(d => {
        const country = d.Country;  // Extract the country
        const dalysValues = Object.entries(d)
            .filter(([year, value]) => year !== "Country")
            .map(([year, value]) => ({ year: +year, dalys: +value }));
        dalysMap.set(country, dalysValues);
    });
    return dalysMap;
}

function transformLevelData(levelData) {
    const levelMap = new Map();
    levelData.forEach(d => {
        const level = d.Exposure;  // Extract the country
        const levelValues = Object.entries(d)
            .filter(([year, value]) => year !== "Country")
            .map(([year, value]) => ({ year: +year, level: +value }));
        levelMap.set(level, levelValues);
    });
    return levelMap;
}

// Load GeoJSON and CSV data
Promise.all([
    d3.json("Choropleth/geomap.json"),
    d3.csv("Choropleth/exposure.csv", d3.autoType),
    d3.csv("Choropleth/dalys.csv", d3.autoType)
]).then(([geoData, rawData, dalysData]) => {
    // Transform exposures and DALYs data
    const exposuresData = transformData(rawData);
    const exposuresMap = d3.group(exposuresData, d => d.country, d => d.year);

    // Transform temperature data
    const dalysMap = transformDalysData(dalysData);

    // Set the color scale domain for DALYs based on the data
    const minDaly = d3.min(dalysData, d => d3.min(Object.values(d).slice(1), v => v));
    const maxDaly = d3.max(dalysData, d => d3.max(Object.values(d).slice(1), v => v));
    dalysColourScale.domain([minDaly, maxDaly]);

    // Draw the map with color based on DALYs
    svgGroup.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
            const countryName = d.properties.name;
            const countryDalysData = dalysMap.get(countryName);
            const yearDalysData = countryDalysData ? countryDalysData.find(d => d.year === 1990) : null;
            const dalys = yearDalysData ? yearDalysData.dalys : 0;  // Default to 0 if no DALYs data is found
            return dalysColourScale(dalys); // Apply colour scale based on DALYs
        })
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
            d3.select(this)
            .attr("stroke-width", 3); // Increase border thickness on mouseover

            const countryName = d.properties.name;
            const countryDalysData = dalysMap.get(countryName);
            const yearDalysData = countryDalysData ? countryDalysData.find(t => t.year === 1990) : null;
            const dalys = yearDalysData ? yearDalysData.dalys : "N/A";
            tooltip.style("display", "block")
                .html(`<strong>${countryName}</strong><br>Year: 1990<br>DALYs: ${dalys}`);
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
    function drawDalysLegend() {
        const legendHeight = 200; // Height of the legend
        const legendWidth = 20; // Width of the legend
        const legendMargin = { top: 25, right: 40, bottom: 10, left: 10 };

        // Create an SVG for the legend
        const legendSvg = d3.select("#choropleth")
            .append("svg")
            .attr("width", legendWidth + legendMargin.left + legendMargin.right)
            .attr("height", legendHeight + legendMargin.top + legendMargin.bottom)
            .attr("id", "dalysLegend")
            .style("position", "absolute")
            .style("top", "20px") // Positioning at the top-right corner
            .style("right", "20px");

        // Create a group for the legend
        const legendGroup = legendSvg.append("g")
            .attr("transform", `translate(${legendMargin.left}, ${legendMargin.top})`);

        // Define the color scale for the legend
        const legendScale = d3.scaleLinear()
            .domain([0, 15])
            .range([legendHeight, 0]);

        // Add a gradient to represent the Dalys colour scale
        const legendGradient = legendGroup.append("defs")
            .append("linearGradient")
            .attr("id", "dalysGradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");
        
        // Add the title "DALYs" above the legend bar
        legendGroup.append("text")
            .attr("x", 25) // Position horizontally at the center of the legend
            .attr("y", -10) // Position above the color bar
            .attr("text-anchor", "middle") // Center the text
            .style("font-size", "14px") // Adjust font size for title
            .style("font-weight", "bold") // Make the title bold
            .text("DALYs"); // Title text

        // Define the color stops for the gradient
        legendGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", dalysColourScale(minDaly));
        legendGradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", dalysColourScale((minDaly+maxDaly)/2));
        legendGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", dalysColourScale(maxDaly));

        // Draw the color bar for the legend
        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#dalysGradient)");

        // Add an axis to the legend for DALYs labels
        const legendAxis = d3.axisRight(legendScale)
            .ticks(6) // Number of ticks for easier reading
            .tickSize(6) // Add size to ticks to ensure they are visible
            .tickFormat(d => `${d}`); 

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

    // Call the legend function to render the DALYs legend
    drawDalysLegend();

    function updateMapColors(year) {
        svgGroup.selectAll("path")
            .data(geoData.features)
            .attr("fill", d => {
                const countryName = d.properties.name;
                const countryDalysData = dalysMap.get(countryName);
                const yearDalysData = countryDalysData ? countryDalysData.find(d => d.year === year) : null; // Dynamic year selection
                const dalys = yearDalysData ? yearDalysData.dalys : 0;  // Default to 0 if no DALYs data is found
                return dalysColourScale(dalys); // Apply color scale based on DALYs
            })
            .attr("stroke", "#333")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                d3.select(this)
                .attr("stroke-width", 3); // Increase border thickness on mouseover
    
                const countryName = d.properties.name;
                const countryDalysData = dalysMap.get(countryName);
                const yearDalysData = countryDalysData ? countryDalysData.find(t => t.year === year) : null;
                const dalys = yearDalysData ? yearDalysData.dalys : "N/A";
                tooltip.style("display", "block")
                    .html(`<strong>${countryName}</strong><br>Year: ${year}<br>DALYs: ${dalys}`);
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
            
            // Update tooltip content if the mouse is hovering over a region
            const hoveredPath = d3.select("path:hover");
            if (!hoveredPath.empty()) {
                const hoveredData = hoveredPath.datum(); // Get data bound to the hovered path
                const countryName = hoveredData.properties.name;
                const countryDalysData = dalysMap.get(countryName);
                const yearDalysData = countryDalysData ? countryDalysData.find(t => t.year === year) : null;
                const dalys = yearDalysData ? yearDalysData.dalys : "N/A";

                tooltip.style("display", "block")
                    .html(`<strong>${countryName}</strong><br>Year: ${year}<br>DALYs: ${dalys}`);
            }


            // Generate DALYs ranking
            const rankings = geoData.features.map(d => {
                const countryName = d.properties.name;
                const countryDalysData = dalysMap.get(countryName);
                const yearDalysData = countryDalysData ? countryDalysData.find(t => t.year === year) : null;
                const dalys = yearDalysData ? yearDalysData.dalys : null;
                return { country: countryName, dalys: dalys };
            }).filter(d => d.dalys !== null) // Exclude countries with no DALYS data
            .sort((a, b) => b.dalys - a.dalys); // Sort by DALYs in descending order

            // Calculate average DALYs
            const totalDalys = rankings.reduce((sum, d) => sum + d.dalys, 0);
            const avgDalys = (rankings.length > 0) ? (totalDalys / rankings.length).toFixed(2) : "N/A";

            // Update the ranking div
            const rankingDiv = d3.select("#dalys_ranking").style("height", "55%");
            const rankingh3 = d3.select("#dalysh3");
            rankingDiv.html(""); // Clear previous rankings
            rankingh3.text(`DALYs Ranking (${year})`);
            const ul = rankingDiv.append("ul")
                .style("list-style-type", "none")
                .style("margin", "0")
                .style("position", "relative")
                .style("left", "-10px");

            rankings.forEach((d, i) => {
                const listItem = ul.append("li")
                    .style("background-color", dalysColourScale(d.dalys))
                    .style("padding", "2px");
    
                // Create a span for the country name and apply a fixed width for alignment
                listItem.append("span")
                    .style("display", "inline-block")
                    .style("width", "130px") // Adjust this width based on your longest country name
                    .text(`${i + 1}. ${d.country}:`);
                
                // Add the DALYs value next to the country with consistent spacing
                listItem.append("span")
                    .style("margin-left", "20px") // Adjust margin for consistent spacing
                    .text(`${d.dalys} years`);
            });
            d3.select("#avgDaly").text(`Average DALYs: ${avgDalys} years`);
    }

    var countryNamePie = null; 
    
    // Function to update circles based on year and PM2.5 concentration
    function updateCircles(year) {
        const circles = svgGroup.selectAll("circle")
            .data(geoData.features);

        circles.enter()
            .append("circle")
            .merge(circles)
            .attr("cx", d => path.centroid(d)[0])
            .attr("cy", d => path.centroid(d)[1])
            .attr("r", d => {
                const countryData = exposuresMap.get(d.properties.name); // Get country exposures data
                const yearData = countryData ? countryData.get(year) : null;
                const exposure = yearData ? yearData[0].concentration : 0; // Access the first item in the array
                return areaScale(exposure); // Size the circles based on the concentration value
            })
            .attr("fill", "cyan")
            .attr("opacity", 0.5)
            .on("mouseover", function(event, d) {
                const countryName = d.properties.name;
                const countryData = exposuresMap.get(countryName);
                const yearData = countryData ? countryData.get(year) : null;
                const exposure = yearData ? yearData[0].concentration : "N/A";
                tooltip.style("display", "block")
                    .html(`<strong>${countryName}</strong><br>Year: ${year}<br>PM2.5 Concentration: ${exposure} µg/m³`);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", `${event.pageY + 5}px`)
                    .style("left", `${event.pageX + 5}px`);
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            })
            .on("click", function(event, d) {
                countryNamePie = d.properties.name; // Get country name from the clicked circle
                // createPieChart(countryName); // Create pie chart for the country
                createPieChartFromCSV(countryNamePie, year); // Create pie chart for the country
            });

        if(countryNamePie != null) {
            createPieChartFromCSV(countryNamePie, year);
        }
        circles.exit().remove();

        // Update tooltip content if the mouse is hovering over a region
        const hoveredCircle = d3.select("circle:hover");
        if (!hoveredCircle.empty()) {
            const hoveredData = hoveredCircle.datum(); // Get data bound to the hovered circle
            const countryName = hoveredData.properties.name;
            const countryData = exposuresMap.get(countryName);
            const yearData = countryData ? countryData.get(year) : null;
            const exposure = yearData ? yearData[0].concentration : "N/A";

            tooltip.style("display", "block")
                .html(`<strong>${countryName}</strong><br>Year: ${year}<br>PM2.5 Concentration: ${exposure} µg/m³`);
        }
        
        // Update map colors based on the selected year
        updateMapColors(year);
    }

    // Initialize circles for the first year 1990)
    updateCircles(1990);

    // Optional: Add slider to update year and update circles
    d3.select("#timeSlider").on("input", function () {
        const year = +this.value;
        d3.select("#yearLabel").text(year);
        updateCircles(year);
    });

    const slider = document.getElementById("timeSlider");
    const yearLabel = document.getElementById("yearLabel");
    const playButton = document.getElementById("playButton");

    let isPlaying = false; // Flag to track animation state
    let intervalId = null; // Store the interval ID

    // Function to update the slider and label
    function updateSlider(value) {
        slider.value = value;
        yearLabel.textContent = value;
        updateCircles(value);
        // Add any additional function here to update the choropleth map, e.g., updateChoropleth(value);
    }

    // Play animation function
    function playAnimation() {
        isPlaying = true;
        playButton.textContent = "Pause";

        intervalId = setInterval(() => {
            const currentValue = parseInt(slider.value);
            const maxValue = parseInt(slider.max);

            if (currentValue < maxValue) {
                updateSlider(currentValue + 1);
            } else {
                clearInterval(intervalId); // Stop animation when reaching max
                playButton.textContent = "Play";
                isPlaying = false;
            }
        }, 100); // Adjust the interval speed (500ms in this case)
    }

    // Pause animation function
    function pauseAnimation() {
        isPlaying = false;
        playButton.textContent = "Play";
        clearInterval(intervalId);
    }

    // Add event listener to the play button
    playButton.addEventListener("click", () => {
        if (isPlaying) {
            pauseAnimation();
        } else {
            playAnimation();
        }
    });

    // Update slider and label when user manually moves the slider
    slider.addEventListener("input", () => {
        if (isPlaying) {
            pauseAnimation();
        }
    });

}).catch(error => console.error("Error loading data:", error));


