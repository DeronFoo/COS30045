function death_rate_SEA() {
    // Set dimensions and margins
    const margin = { top: 20, right: 90, bottom: 70, left: 130 };
    const width = 1000 - margin.left - margin.right;

    // Load data from CSV
    d3.csv("Bar Chart/overall_death_rate_SEA.csv").then(function (data) {
        // Parse data to ensure the number of deaths is a numeric value
        data.forEach(d => d.NumberOfDeath = +d["Number of Death"]);

        // Dynamically calculate height based on data length
        const barHeight = 30; // Height of each bar
        const paddingBetweenBars = 5; // Padding between bars
        const height = data.length * (barHeight + paddingBetweenBars);
        const totalHeight = height + margin.top + margin.bottom;

        // Create an SVG container with the calculated total height
        const svg = d3.select("#death_rate_SEA_chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", totalHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X Scale
        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.NumberOfDeath)])
            .range([0, width]);

        // Y Scale
        const y = d3.scaleBand()
            .domain(data.map(d => d.Country))
            .range([0, height])
            .padding(0.2);

        // Color for bars
        const barColor = "#69b3a2";

        // Add X Axis
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => d.toLocaleString()))
            .selectAll("text")
            .style("font-size", "14px");

        // Add X Axis Label
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Number of Deaths");

        // Add Y Axis
        svg.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .selectAll("text")
            .style("font-size", "14px");

        // Add Y Axis Label
        svg.append("text")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 40)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Countries");

        // Add bars with transition animation
        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d.Country))
            .attr("width", 0) // Start with width 0 for animation
            .attr("height", y.bandwidth())
            .style("fill", barColor)
            .transition() // Transition animation
            .duration(1000)
            .ease(d3.easeLinear)
            .delay((d, i) => i * 200) // Delay for each bar (200ms per bar)
            .attr("width", d => x(d.NumberOfDeath));

        // Add labels outside the bars with transition animation
        svg.selectAll(".bar-label")
            .data(data)
            .enter().append("text")
            .attr("class", "bar-label")
            .attr("x", 0) // Start at x = 0 for animation
            .attr("y", d => y(d.Country) + y.bandwidth() / 1.5)
            .style("fill", "black")
            .style("font-size", "12px")
            .style("text-anchor", "start")
            .text(d => d.NumberOfDeath.toLocaleString())
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .delay((d, i) => i * 200) // Same delay as bars
            .attr("x", d => x(d.NumberOfDeath) + 10); // Move to final position

    }).catch(error => {
        console.error('Error loading the CSV file:', error);
    });
}

// Call the function
death_rate_SEA();
