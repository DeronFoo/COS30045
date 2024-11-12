document.addEventListener("DOMContentLoaded", function() {
    const margin = { top: 50, right: 150, bottom: 50, left: 60 },
          width = 900 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;
  
    // Parse the year and data format
    const parseYear = d3.timeParse("%Y");
  
    // Load data
    d3.csv("Line Graph/riskFactor.csv").then(data => {
      const years = Object.keys(data[0]).slice(1).map(d => parseYear(d));
      const risks = data.map(d => ({
        name: d.Risks,
        values: years.map((year, i) => ({ year, value: +d[Object.keys(d)[i + 1]] }))
      }));
  
      // Scales
      const x = d3.scaleTime().domain(d3.extent(years)).range([0, width]);
      const y = d3.scaleLinear().domain([0, d3.max(risks, d => d3.max(d.values, v => v.value))]).nice().range([height, 0]);
      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(risks.map(d => d.name));
  
      // SVG and group
      const svg = d3.select("#linegraph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      // Axes
      svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")));
      svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));
  
      // Line generator
      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value));
  
      // Tooltip
      const tooltip1 = d3.select("body").append("div")
        .attr("class", "tooltip").style("opacity", 0);
  
      // Draw lines and labels
      risks.forEach(risk => {
        svg.append("path")
          .datum(risk.values)
          .attr("class", "line")
          .attr("d", line)
          .attr("stroke", color(risk.name))
          .on("mouseover", function() { d3.select(this).attr("stroke-width", 3); })
          .on("mouseout", function() { d3.select(this).attr("stroke-width", 1.5); })
          .on("click", function() {
            // Highlight the selected line
            svg.selectAll(".line").attr("opacity", 0.2);
            d3.select(this).attr("opacity", 1).attr("stroke-width", 2.5);
            // Show data points along the line on click
            svg.selectAll(".data-point").remove();
            svg.selectAll(".data-point")
              .data(risk.values)
              .enter().append("circle")
              .attr("class", "data-point")
              .attr("cx", d => x(d.year))
              .attr("cy", d => y(d.value))
              .attr("r", 3)
              .attr("fill", color(risk.name))
              .append("title").text(d => `${d.year.getFullYear()}: ${d.value}`);
          });
  
        // Label each line on the right side
        svg.append("text")
          .attr("transform", `translate(${width + 5}, ${y(risk.values[risk.values.length - 1].value)})`)
          .attr("dy", "0.35em")
          .attr("fill", color(risk.name))
          .text(risk.name);
      });
  
      // Tooltip functionality
      svg.selectAll(".line")
        .on("mousemove", function(event, d) {
          const yearData = d3.timeFormat("%Y")(x.invert(d3.pointer(event)[0]));
          const sortedRisks = risks.sort((a, b) => b.values[yearData - 2011].value - a.values[yearData - 2011].value)
            .map((risk, i) => `${i + 1}. ${risk.name}: ${risk.values[yearData - 2011].value}M`);
  
          tooltip1.style("opacity", 1)
            .html(`<strong>${yearData}</strong><br>${sortedRisks.join("<br>")}`)
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseleave", () => tooltip1.style("opacity", 0));
    });
  });