function switchTab3(tab) {
    const globalTab = document.getElementById("tab-global");
    const seaTab = document.getElementById("tab-sea");
    const globalContent = document.getElementById("content-global");
    const seaContent = document.getElementById("content-sea");

    if (tab === "global") {
        globalTab.style.backgroundColor = "#f8f8f8";
        seaTab.style.backgroundColor = "#fff";
        globalContent.style.display = "block";
        seaContent.style.display = "none";

        // Trigger the global pollution source logic
        pollution_source(false);
    } else if (tab === "sea") {
        seaTab.style.backgroundColor = "#f8f8f8";
        globalTab.style.backgroundColor = "#fff";
        globalContent.style.display = "none";
        seaContent.style.display = "block";

        pollution_source_overview_SEA()
    }
}

function pollution_source(check = true) {
    // Load dataset from the JSON file
    d3.json("StackedBar/pollution_source_data.json").then(dataset => {
        // Stack setup
        var stack = d3.stack()
            .keys(["Latin America And Caribbean", "North America", "Africa", "West Asia", "Asia And Pacific", "Europe"])
            .value((d, key) => {
                // Normalize data by total for the sector
                var total = d3.sum(["Latin America And Caribbean", "North America", "Africa", "West Asia", "Asia And Pacific", "Europe"].map(k => d[k]));
                return d[key] / total;
            });

        var series = stack(dataset);

        // SVG canvas
        const w = 1000, h = 580, padding = 50;
        d3.select("#pollution_source_chart").select("svg").remove();

        const xScale = d3.scaleBand()
            .domain(dataset.map(d => d.Sector))
            .range([padding + 10, w - padding])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, 1]) // Stacked chart to 100%
            .range([h - padding - 50, padding]);

        // Use a categorical color palette
        const color = d3.scaleOrdinal()
            .domain(["Latin America And Caribbean", "North America", "Africa", "West Asia", "Asia And Pacific", "Europe"])
            .range(d3.schemeSet2); // Switch to a distinct, categorical palette

        const svg = d3.select("#pollution_source_chart")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "1px solid #ddd")
            .style("padding", "5px")
            .style("display", "none");

        // Draw groups and rectangles
        svg.selectAll("g")
            .data(series)
            .enter()
            .append("g")
            .style("fill", (d, i) => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.data.Sector))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .on("mouseover", (event, d) => {
                const regionName = d3.select(event.currentTarget.parentNode).datum().key;
                const value = ((d[1] - d[0]) * 100).toFixed(2);
                const actualValue = d.data[regionName];

                tooltip.style("display", "block")
                    .html(`Sector: ${d.data.Sector}<br>Region: ${regionName}<br>Value: ${value}%<br>Actual Value: ${actualValue} µg/m³`);
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        // Axes
        svg.append("g")
            .attr("transform", `translate(0,${h - padding - 50})`)
            .call(d3.axisBottom(xScale).tickSizeOuter(0))
            .selectAll("text")
            .attr("transform", "rotate(-35)")
            .style("text-anchor", "end")
            .style("font-size", "16px");

        svg.append("g")
            .attr("transform", `translate(${padding + 10},0)`)
            .style("font-size", "16px")
            .call(d3.axisLeft(yScale).tickFormat(d => `${d * 100}%`));

        if(check) {
            // Add legends to the div with id regionLegends
            const regions = ["Europe", "Asia And Pacific", "West Asia", "Africa", "North America", "Latin America And Caribbean"];
    
            const legendContainer = d3.select("#regionLegends")
                .append("div")
                .attr("class", "legend-container")
                .style("display", "flex")
                .style("text-align", "left")
                .style("flex-direction", "column") // Stack legends vertically
                .style("gap", "10px");
    
            regions.forEach(region => {
                const legendItem = legendContainer.append("div")
                    .style("display", "flex")
                    .style("align-items", "center")
                    .style("gap", "10px");
    
                // Add color square
                legendItem.append("div")
                    .style("width", "20px") // Fixed width
                    .style("height", "20px") // Fixed height
                    .style("background-color", color(region));
    
                // Add region name
                legendItem.append("span")
                    .text(region)
                    .style("font-size", "16px")
                    .style("color", "#333")
                    .style("flex-grow", "1"); // Ensures text aligns neatly next to the color box
            });
        }

    }).catch(error => console.error("Error loading data:", error));
}

function pollution_source_overview_SEA() {
    const fileName = `StackedBar/Pollution_Source_SEA/southeastAsia.csv`;

    d3.csv(fileName).then(data => {
        const w = 900, h = 500, padding = 50;

        let svg = d3.select("#pollution_source_chart svg");
        if (svg.empty()) {
            svg = d3.select("#pollution_source_chart")
                .append("svg")
                .attr("width", w)
                .attr("height", h);
        } else {
            svg.selectAll("*").remove();
        }

        // Add tooltip element
        const tooltip = d3.select("#pollution_source_chart")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "1px solid #ccc")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("box-shadow", "0px 2px 5px rgba(0,0,0,0.3)")
            .style("display", "none");

        // Prepare the data for stacking and normalize it
        const pollutionSources = data.map(d => {
            const total = Object.entries(d)
                .slice(1) // Skip the first column (country name)
                .reduce((sum, [key, value]) => sum + (+value || 0), 0); // Calculate the total

            return {
                country: d[data.columns[0]], // First column is the country name
                ...Object.entries(d).slice(1).reduce((acc, [key, value]) => {
                    acc[key] = { value: +value || 0, percentage: (+value || 0) / total }; // Store value and percentage
                    return acc;
                }, {})
            };
        });

        const stack = d3.stack()
            .keys(data.columns.slice(1)) // Pollution source keys
            .value((d, key) => d[key]?.percentage || 0);

        const stackedData = stack(pollutionSources);

        // Define scales
        const xScale = d3.scaleBand()
            .domain(pollutionSources.map(d => d.country))
            .range([padding, w - padding])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, 1]) // Normalized to 100%
            .range([h - padding, padding]);

        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(data.columns.slice(1))
            .range(d3.schemeSet2);

        // Draw bars
        svg.append("g")
            .selectAll("g")
            .data(stackedData)
            .enter()
            .append("g")
            .attr("fill", d => colorScale(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.data.country))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("width", xScale.bandwidth())
            .on("mouseover", (event, d) => {
                const sourceKey = d3.select(event.target.parentNode).datum().key;
                const dataPoint = d.data[sourceKey];
                const percentage = (dataPoint?.percentage * 100).toFixed(2) + "%";

                tooltip
                    .html(`
                        Country: ${d.data.country}<br/>
                        Sector:${sourceKey}<br/>
                        Percentage: ${percentage}
                    `)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`)
                    .style("display", "block");
            })
            .on("mousemove", event => {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            })
            .on("mouseout", () => {
                tooltip.style("display", "none");
            });

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${h - padding})`)
            .call(d3.axisBottom(xScale).tickSizeOuter(0))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", "16px");

        svg.append("g")
            .attr("transform", `translate(${padding},0)`)
            .call(d3.axisLeft(yScale).tickFormat(d => `${(d * 100).toFixed(0)}%`))
            .style("font-size", "16px");

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${w - padding}, ${padding})`); 

        const keys = data.columns.slice(1).reverse(); // Reverse the order to match the bar stack
        keys.forEach((key, i) => {
            legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", colorScale(key));

            legend.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 12)
                .text(key)
                .style("font-size", "16px")
                .attr("alignment-baseline", "middle");
        });
    }).catch(error => console.error("Error loading data:", error));
}

function pollution_source_SEA(country) {
    const fileName = `StackedBar/Pollution_Source_SEA/${country}.csv`;

    d3.csv(fileName).then(data => {
        const w = 1000, h = 580, padding = 50;

        let svg = d3.select("#pollution_source_chart svg");
        if (svg.empty()) {
            svg = d3.select("#pollution_source_chart")
                .append("svg")
                .attr("width", w)
                .attr("height", h);
        } else {
            svg.selectAll("*").remove();
        }

        data.forEach(d => d.Value = +d.Value);

        const xScale = d3.scaleBand()
            .domain(data.map(d => d.Sector))
            .range([padding + 10, w - padding])
            .padding(0.1);

        const yScale = d3.scaleLinear()
                        .domain([0, d3.max(data, d => +d.Value)])
                        .range([h - padding - 50, padding]);

        // Fixed color mapping for each sector
        const color = {
            "Energy": "#E69F00",                // Amber
            "Residential": "#56B4E9",           // Light Blue
            "Industry": "#009E73",              // Green
            "Transport": "#F0E442",             // Yellow
            "Waste": "#0072B2",                 // Blue
            "Agriculture": "#D55E00",           // Red-Orange
            "Agr. Waste Burning": "#CC79A7",    // Pink
            "Other Fires": "#999999",           // Light Gray
            "Windblown Dust": "#F0E442",        // Yellow
            "Shipping": "#56B4E9",              // Light Blue
            "Anthropogenic dust": "#009E73",   // Green
            "Commercial": "#0072B2",            // Blue
            "Solvents": "#D55E00",              // Red-Orange
            "Other Combustion": "#CC79A7",      // Pink
            "Remaining Sources": "#999999"      // Light Gray
        };

        // Tooltip setup
        const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("padding", "5px")
        .style("display", "none");


        svg.selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", d => xScale(d.Sector))
            .attr("width", xScale.bandwidth())
            .attr("fill", d => color[d.Sector] || "#000000") // Default color if sector is not in the mapping
            .attr("y", h - padding - 50) // Start from the bottom of the chart
            .attr("height", 0) // Start with height 0
            .transition()
            .duration(550)
            .ease(d3.easeCircleOut)
            .delay(200)
            .attr("y", d => yScale(d.Value))
            .attr("height", d => h - padding - 50 - yScale(d.Value));

        svg.selectAll("rect")
            .data(data)
            .join("rect")
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block")
                    .html(`Sector: ${d.Sector}<br>Value: ${d.Value}%`);
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        svg.append("g")
            .attr("transform", `translate(0,${h - padding - 50})`)
            .call(d3.axisBottom(xScale).ticks(15))
            .selectAll("text")
            .attr("transform", "rotate(-35)")
            .style("text-anchor", "end")
            .style("font-size", "16px")
            .on("mouseover", function(event, d) {
                // Show tooltip when hovering over the x-axis labels
                tooltip.style("display", "block")
                    .html(`Sector: ${d}<br>Value: ${d.Value}%`);
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"));;

        svg.append("g")
            .attr("transform", `translate(${padding + 10},0)`)
            .style("font-size", "16px")
            .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`));
    }).catch(error => console.error("Error loading data:", error));
}

// Initial chart load
pollution_source();

// Button click handler
d3.selectAll("#button_pollution_source button").on("click", function() {
    const selectedCountry = d3.select(this).text();
    pollution_source_SEA(selectedCountry);
});
