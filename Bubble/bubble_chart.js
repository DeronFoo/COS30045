const width = 900;
const height = 600;

const bubbleSvg = d3.select("#bubble_chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().on("zoom", (event) => {
        bubbleSvg.attr("transform", event.transform);  // Apply zoom/pan transform to SVG
    }))
    .append("g");  // Append a group to hold the bubbles

// Linear size scale for bubbles
const sizeScale = d3.scaleLinear()
    .domain([0, 300])  // AQI range from 0 to 300
    .range([10, 120]);   // Bubble size range

// Define a color scale based on AQI ranges
function getColorByAQI(AQI) {
    if (AQI <= 50) return "#00FF00";  // Good
    if (AQI <= 100) return "#FFFF00"; // Moderate
    if (AQI <= 150) return "#FF8C00"; // Unhealthy for Sensitive Groups
    if (AQI <= 200) return "#FF0000"; // Unhealthy
    if (AQI <= 300) return "#8B0000"; // Very Unhealthy
    return "#800080";                 // Hazardous
}

// Tooltip setup
const tooltip1 = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.csv("Bubble/pollutionIndex.csv", d3.autoType).then(data => {
    data.sort((a, b) => b.PollutionIndex - a.PollutionIndex);

    // Set up a circular packing layout
    const pack = d3.pack()
        .size([width, height])
        .padding(10);

    const root = d3.hierarchy({ children: data })
        .sum(d => sizeScale(d.PollutionIndex));

    const nodes = pack(root).children;

    const circles = bubbleSvg.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.r)
        .attr("fill", d => getColorByAQI(d.data.PollutionIndex))
        .on("mouseover", (event, d) => {
            tooltip1.transition().duration(200).style("opacity", .9);
            tooltip1.html(`Country: ${d.data.Country}<br>Pollution Index: ${d.data.PollutionIndex}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", (event, d) => {
            tooltip1.transition().duration(500).style("opacity", 0);
        });

    // Add country flag emojis instead of country names
    const labels = bubbleSvg.selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 20)  // Adjust size for emoji
        .text(d => d.data.Flags);

    labels.each(function (d) {
        const bbox = this.getBBox();
        const labelX = d.x + 10 - bbox.width / 2;
        const labelY = d.y + 3;
        d3.select(this).attr("x", labelX).attr("y", labelY);
    });

    // Add the AQI Classification legend
    const legendData = [
        { range: "0-50", label: "Good", color: "#00FF00" },
        { range: "51-100", label: "Moderate", color: "#FFFF00" },
        { range: "101-150", label: "Unhealthy for Sensitive Groups", color: "#FF8C00" },
        { range: "151-200", label: "Unhealthy", color: "#FF0000" },
        { range: "201-300", label: "Very Unhealthy", color: "#8B0000" },
        { range: "300+", label: "Hazardous", color: "#800080" }
    ];

    const legend = bubbleSvg.append("g")
        .attr("transform", "translate(20,20)");

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
});
