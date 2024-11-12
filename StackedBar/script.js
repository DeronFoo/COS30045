function pollution_source() {
    // Load dataset from the JSON file
    d3.json("StackedBar/pollution_source_data.json").then(dataset => {

        // Set up the stack with keys for regions
        var stack = d3.stack()
            .keys(["Latin America And Caribbean", "North America", "Africa", "West Asia", "Asia And Pacific", "Europe"])
            .value(function(d, key) {
                // Normalize the data: divide each value by the total of the sector
                var total = d3.sum(["Latin America And Caribbean", "North America", "Africa", "West Asia", "Asia And Pacific", "Europe"]
                                    .map(k => d[k]));
                return d[key] / total; // Proportional value
            });

        // Create the series data with normalized values
        var series = stack(dataset);

        // SVG canvas dimensions
        var w = 900;
        var h = 500;
        var padding = 50;
                                              
        // Set up x-scale with sector names
        var xScale = d3.scaleBand()
            .domain(dataset.map(d => d.Sector))
            .range([padding, w - padding])
            .padding(0.1);

        // Set up y-scale based on the normalized values (0 to 1)
        var yScale = d3.scaleLinear()
            .domain([0, 1]) // 100% stacked, so y-range should go from 0 to 1
            .range([h - padding, padding]);

        // Create SVG
        var svg = d3.select("#pollution_source_chart")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        // Color scale
        var color = d3.scaleOrdinal()
        .domain(["Latin America And Caribbean", "North America", "Africa", "West Asia", "Asia And Pacific", "Europe"])
        .range(d3.schemePuRd[7].slice(1).reverse()); // Pick the first 6 colors from the scheme

        // Tooltip div
        var tooltip4 = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "1px solid #ddd")
            .style("padding", "5px")
            .style("display", "none");

        // Draw groups for each stack series
        var groups = svg.selectAll("g")
            .data(series)
            .enter()
            .append("g")
            .style("fill", (d, i) => color(i));

        // Draw rectangles for each stack layer
        groups.selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", (d, i) => xScale(d.data.Sector))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("width", xScale.bandwidth())
            .on("mouseover", (event, d) => {
                // Get the current region name by identifying the parent group (key)
                const regionName = d3.select(event.currentTarget.parentNode).datum().key;
                const value = ((d[1] - d[0]) * 100).toFixed(2); // Convert to percentage

                tooltip4.style("display", "block")
                    .html(`Sector: ${d.data.Sector}<br>
                           Country: ${regionName}<br>
                           Value: ${value}%`);
            })
            .on("mousemove", event => {
                tooltip4.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
                tooltip4.style("display", "none");
            });

        // Add x-axis
        svg.append("g")
            .attr("transform", `translate(0,${h - padding})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Add y-axis
        svg.append("g")
            .attr("transform", `translate(${padding},0)`)
            .call(d3.axisLeft(yScale).tickFormat(d => `${d * 100}%`));

    }).catch(error => console.error("Error loading data:", error));
}

// Call the function to draw the chart
pollution_source();
