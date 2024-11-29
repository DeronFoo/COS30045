const width = 780;
const height = 600;

const bubbleSvg = d3.select("#bubble_chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const bubbleGroup = bubbleSvg.append("g");  

// Set up zoom behavior only on bubbles
bubbleSvg.call(
    d3.zoom()
        .scaleExtent([0.5, 2])  // Define zoom range
        .on("zoom", (event) => {
            bubbleGroup.attr("transform", event.transform);  // Apply zoom/pan transform to bubbles
        })
);

// Linear size scale for bubbles
const sizeScale = d3.scaleLinear()
    .domain([0, 300])  // AQI range from 0 to 300
    .range([20, 200]);   // Bubble size range

// Define a color scale based on AQI ranges
function getColorByAQI(AQI) {
    if (AQI <= 50) return "#00FF00";  // Good
    if (AQI <= 100) return "#bdbd02"; // Moderate
    if (AQI <= 150) return "#FF8C00"; // Unhealthy for Sensitive Groups
    if (AQI <= 200) return "#FF0000"; // Unhealthy
    if (AQI <= 300) return "#a81616"; // Very Unhealthy
    return "#a803a8";                 // Hazardous
}

// Function to get the AQI status based on the AQI value
function getAQIStatus(aqi) {
    if (aqi >= 300) return "Hazardous";
    else if (aqi >= 200) return "Very Unhealthy";
    else if (aqi >= 150) return "Unhealthy";
    else if (aqi >= 100) return "Unhealthy for Sensitive Groups";
    else if (aqi >= 50) return "Moderate";
    else return "Good";
}

// Load the cities.json file once, to avoid repeated requests
let citiesData;
d3.json("Bubble/cities.json").then(function(data) {
    citiesData = data;
});

d3.csv("Bubble/pollutionIndex.csv", d3.autoType).then(data => {
    data.sort((a, b) => b.PollutionIndex - a.PollutionIndex);
    
    // Map to store hover state
    const hoverState = new Map();

    const tooltip1 = d3.select("#bubble_tooltip");

    // Add the AQI Classification legend
    const legendData = [
        { range: "0-50", label: "Good", color: "#00FF00" },
        { range: "51-100", label: "Moderate", color: "#bdbd02" },
        { range: "101-150", label: "Unhealthy for Sensitive Groups", color: "#FF8C00" },
        { range: "151-200", label: "Unhealthy", color: "#FF0000" },
        { range: "201-300", label: "Very Unhealthy", color: "#a81616" },
        { range: "300+", label: "Hazardous", color: "#a803a8" }
    ];

    const legend = bubbleSvg.append("g")
        .attr("transform", "translate(0,10)");

    legend.selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", d => d.color);

    legend.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 30)
        .attr("y", (d, i) => i * 20 + 10)
        .text(d => `${d.range}: ${d.label}`)
        .attr("font-size", "12px")
        .attr("dy", ".35em");
    
    // Function to update tooltip content
    function updateTooltip(event, d) {
        // Set the country name in the header
        tooltip1.select(".tooltip-header h3").text(d.data.Country + " " + d.data.Flags);
    
        // Set AQI value and its color
        tooltip1.select(".tooltip-aqi")
            .style("color", getColorByAQI(d.data.PollutionIndex))
            .html(`Current Air Quality: <strong>${d.data.PollutionIndex}</strong>`);
    
        // Set status color and text based on AQI
        const status = getAQIStatus(d.data.PollutionIndex);
        tooltip1.select(".tooltip-status")
            .style("background-color", getColorByAQI(d.data.PollutionIndex))
            .text(`Status: ${status}`);
        
        // Set the last updated text
        tooltip1.select(".tooltip-date").text(`Last Updated: Nov 13th, 2024`);

        // Position the tooltip based on mouse position, ensuring it stays within bounds
        const tooltipWidth = tooltip1.node().offsetWidth;
        const tooltipHeight = tooltip1.node().offsetHeight;
        
        // Adjust position to prevent overflow
        const tooltipX = Math.min(event.pageX - 10, window.innerWidth - tooltipWidth - 10);
        const tooltipY = Math.min(event.pageY - 30, window.innerHeight - tooltipHeight - 10);

        tooltip1.style("left", tooltipX + "px")
            .style("top", tooltipY + "px")
            .style("opacity", 1);
    }

    // Function to handle mouseover effect on both circles and text
    function handleMouseOver(event, d, element) {
        hoverState.set(d.data.Country, true);  // Set hover state
        element.transition().duration(200)
            .attr("r", d.r * 1.1)  // Slightly increase radius
            .attr("stroke-width", 3);  // Thicken stroke width

        // Call the updateTooltip function to update the tooltip content
        updateTooltip(event, d);
    }

    // Function to handle mouseout effect on both circles and text
    function handleMouseOut(event, d, element) {
        hoverState.set(d.data.Country, false);  // Set hover state
        setTimeout(() => {
            // Only reset if still not hovered
            if (!hoverState.has(d.data.Country) || !hoverState.get(d.data.Country)) {
                tooltip1.transition().duration(500).style("opacity", 0);  // Hide tooltip
                
                element.transition().duration(200)
                    .attr("r", d.r)  // Reset to original radius
                    .attr("stroke-width", 1);  // Reset stroke width
            }
        }, 100);  // Add a small delay to ensure no flicker

         // Prevent tooltip from disappearing if another bubble is being hovered
        if (hoverState.size === 0) {
            tooltip1.transition().duration(500).style("opacity", 0);
        }
    }

    // Function to handle click event on a bubble
    function handleClick(event, d) {
        // Check if citiesData is loaded
        if (!citiesData) {
            console.error("Cities data is not loaded!");
            return;
        }

        // Set the country name in the heading
        d3.select("#country").text(`${d.data.Country}'s City AQI Details`);

        const cityAqiContainer = d3.select("#city-aqi").html(""); 

        const countryData = citiesData[d.data.Country];
        if (!countryData) {
            console.error("Country data not found!");
            return;
        }

        // Create a listing of cities and their AQI
        countryData.cities.forEach(city => {
            const cityItem = cityAqiContainer.append("div")
                .attr("class", "city-aqi-item")
                .style("display", "flex")
                .style("justify-content", "space-between")
                .style("padding", "5px")
                .style("margin-bottom", "2px")
                .style("background-color", getColorByAQI(city[1]));


            // City name
            cityItem.append("span")
                .attr("class", "city-name")
                .text(city[0]);

            // AQI value
            cityItem.append("span")
                .attr("class", "city-aqi-value")
                .text(city[1])
                .style("font-weight", "bold")
        });
    }

    // Add a mousemove event to update the tooltip position while moving within the bubble
    bubbleSvg.on("mousemove", function(event) {
        // Ensure the tooltip stays visible if any bubble is being hovered over
        if (hoverState.size > 0) {
            const d = Array.from(hoverState.values())[0];  // Get the hovered data
            updateTooltip(event, d);
        }
    });

    function updateRankingList(filteredData) {
        // Sort data by PollutionIndex in descending order
        filteredData.sort((a, b) => b.PollutionIndex - a.PollutionIndex);
    
        // Select the ranking container and clear existing content
        const rankingContainer = d3.select("#ranking").html(""); 
    
        // Create a list item for each country
        filteredData.forEach(country => {
            const listItem = rankingContainer.append("div")
                .attr("class", "ranking-item")
                .style("display", "flex")
                .style("justify-content", "space-between")
                .style("padding", "5px")
                .style("margin-bottom", "2px")
                .style("background-color", getColorByAQI(country.PollutionIndex));
    
            // Country name
            listItem.append("span")
                .attr("class", "ranking-country")
                .text(country.Country);
    
            // AQI value
            listItem.append("span")
                .attr("class", "ranking-aqi")
                .text(country.PollutionIndex)
                .style("font-weight", "bold");
        });
    }

    // Function to filter and update the visualisation based on region
    function filterByRegion(region) {
        const filteredData = region === 'World' ? data : data.filter(d => d.Region === region);

        // Update the ranking list
        updateRankingList(filteredData);

        const maxPollution = d3.max(filteredData, d => d.PollutionIndex);
        sizeScale.domain([0, maxPollution]);  // Update size scale based on filtered data

        const pack = d3.pack()
            .size([width, height])
            .padding(5);

        // Recalculate the pack layout with the filtered data
        const root = d3.hierarchy({ children: filteredData })
            .sum(d => sizeScale(d.PollutionIndex)); // Use sizeScale to define circle sizes in the layout

        const nodes = pack(root).leaves(); // Get the positioned nodes

        const bubbleGroups = bubbleGroup.selectAll("g.bubble-group")
            .data(nodes, d => d.data.Country)
            .join(
                enter => {
                    const group = enter.append("g")
                        .attr("class", "bubble-group")
                        .attr("transform", d => `translate(${d.x+40},${d.y+10})`);

                    group.append("circle")
                        .attr("id", d => "circle-" + d.data.Country)
                        .attr("class", "bubble")
                        .attr("r", d => d.r)
                        .attr("fill", d => getColorByAQI(d.data.PollutionIndex))
                        .attr("stroke", "#333")
                        .attr("stroke-width", 1)
                        .attr("cursor", "pointer")
                        .on("mouseover", function(event, d) {
                            handleMouseOver(event, d, d3.select(this)); 
                        })
                        .on("mouseout", function(event, d) {
                            handleMouseOut(event, d, d3.select(this));  
                        })
                        .on("click", function(event, d) {
                            handleClick(event, d);  // Call handleClick when a bubble is clicked
                        });

                    group.append("text")
                        .attr("text-anchor", "middle")
                        .attr("dy", ".3em")
                        .attr("font-size", "20px")
                        .attr("font-weight", "bold")
                        .text(d => d.data.Flags)
                        .attr("cursor", "pointer")
                        .on("mouseover", function(event, d) {
                            handleMouseOver(event, d, d3.select(this)); 
                        })
                        .on("mouseout", function(event, d) {
                            handleMouseOut(event, d, d3.select(this)); 
                        })
                        .on("click", function(event, d) {
                            handleClick(event, d);  // Call handleClick when a bubble is clicked
                        });
                },
                update => {
                    update.transition()
                        .duration(500)
                        .attr("transform", d => `translate(${d.x+40},${d.y+10})`);  // Ensure bubbles are repositioned
                    
                    update.select("circle")
                        .attr("r", d => d.r)
                        .attr("fill", d => getColorByAQI(d.data.PollutionIndex));

                    update.select("text")
                        .text(d => d.data.Flags);  // Update text content if necessary
                },
                exit => exit.remove()
            );
    }

    // Listen for changes in the radio buttons
    d3.selectAll("input[name='region']").on("change", function() {
        filterByRegion(this.value);  // Filter based on the selected region
    });

    // Default filter by World
    filterByRegion("World");
});

    