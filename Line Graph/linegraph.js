// Dimensions and margins
const margin = { top: 30, right: 300, bottom: 50, left: 60 };
const line_width = 950 - margin.left - margin.right;
const line_height = 525 - margin.top - margin.bottom;

// Append SVG to the div
const lineSvg = d3.select("#linegraph")
    .append("svg")
    .attr("width", line_width + margin.left + margin.right)
    .attr("height", line_height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create a tooltip
const line_tooltip = d3.select("#line_tooltip");

// Load the data
d3.csv("Line Graph/riskFactor.csv", d3.autoType).then(data => {
    // Parse the years from the data and reshape
    const years = Object.keys(data[0]).filter(key => !isNaN(+key)); // Exclude the "Risks" column
    const dataset = data.map(d => ({
        name: d.Risks,
        values: years.map(year => ({
                year: +year,
                value: d[year]
        }))
    }));

    // Define scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(years, d => +d))
        .range([0, line_width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d3.max(d.values, v => v.value))])
        .nice()
        .range([line_height, 0]);

    const colourScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(dataset.map(d => d.name));

    // Draw axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    lineSvg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${line_height})`)
        .call(xAxis);

    lineSvg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // Add X-axis label
    lineSvg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", line_width / 2)
        .attr("y", line_height + margin.bottom - 10) // Position below the X-axis
        .style("font-size", "14px")
        .text("Year (2011 - 2021)");

    // Add Y-axis label
    lineSvg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90)`)
        .attr("x", -line_height / 2) // Center the label along the Y-axis
        .attr("y", -margin.left + 20) // Position to the left of the Y-axis
        .style("font-size", "14px")
        .text("Disease Burden (DALYs, in millions)");

    // Draw lines
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.value));

    lineSvg.selectAll(".line")
        .data(dataset)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d.values))
        .attr("stroke", d => colourScale(d.name))
        .attr("stroke-width", 2);

    // Add data nodes (dots)
    lineSvg.selectAll(".dots")
        .data(dataset)
        .enter()
        .append("g")
        .attr("class", "dots")
        .each(function (d) {
            d3.select(this).selectAll("circle")
                .data(d.values)
                .enter()
                .append("circle")
                .attr("cx", v => xScale(v.year))
                .attr("cy", v => yScale(v.value))
                .attr("r", 2) // Radius of the circle
                .attr("fill", colourScale(d.name));
        });

    // Add legend
    const legend = lineSvg.append("g")
        .attr("transform", `translate(${line_width + 30}, 0)`);

    dataset.forEach((d, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", colourScale(d.name));

        legend.append("text")
            .attr("x", 15)
            .attr("y", i * 20 + 10)
            .text(d.name)
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");
    });

    // Add overlay for tooltip and vertical line
    const verticalLine = lineSvg.append("line")
        .attr("class", "vertical-line")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .style("opacity", 0); // Initially hidden

    // Add overlay for tooltip
    const overlay = lineSvg.append("rect")
        .attr("width", line_width)
        .attr("height", line_height)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mousemove", onMouseMove)
        .on("mouseout", () => {
            line_tooltip.style("opacity", 0);
            verticalLine.style("opacity", 0); // Hide vertical line
            d3.selectAll(".dots circle").attr("r", 2); // Reset dot sizes
        });

    function onMouseMove(event) {
        const mouse = d3.pointer(event);
        const year = Math.round(xScale.invert(mouse[0]));

        if (year < +years[0] || year > +years[years.length - 1]) return;

        const closestData = dataset.map(d => ({
            name: d.name,
            value: d.values.find(v => v.year === year)?.value
        }));

        // Sort the closest data by value in descending order
        closestData.sort((a, b) => b.value - a.value);

        // Update tooltip
        line_tooltip.style("opacity", 1)
            .style("left", `${event.pageX + 40}px`) // Adjust X dynamically
            .style("top", `73px`) // Fixed Y-position
            .html(`<strong>Year: ${year} in DALYs</strong><br>` +
                `<table style="width: 100%; text-align: left;">` +
                closestData.map(d => `
                    <tr>
                        <td style="width: 10px;">
                            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${colourScale(d.name)};"></span>
                        </td>
                        <td>${d.name}</td>
                        <td style="text-align: right;">${d.value} million</td>
                    </tr>
                `).join("") +
                `</table>`);


        // Update vertical line position
        verticalLine
            .attr("x1", xScale(year))
            .attr("x2", xScale(year))
            .attr("y1", 0)
            .attr("y2", line_height)
            .style("opacity", 0.5);

        // Highlight the dots for the hovered year
        d3.selectAll(".dots circle")
            .attr("r", v => (v.year === year ? 4 : 2)); // Increase radius for matching dots
    }
});