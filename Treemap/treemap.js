function death_factor() {
    d3.csv("Treemap/death_factor.csv").then(function(data) {
        data.forEach(function(d) {
            d.NumberOfDeath = +d['Number of Death'];
        });

        const width = 600;
        const height = 400;
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const root = d3.hierarchy({ name: 'root', children: data })
            .sum(d => d.NumberOfDeath)
            .sort((a, b) => b.value - a.value);

        const treemap = d3.treemap().size([width, height]).padding(5);
        treemap(root);

        const svg = d3.select('#death_factor_chart').append('svg')
            .attr('width', width)
            .attr('height', height);

        // Create tooltip
        const tooltips = d3.select("body").append("div")
            .attr("class", "tooltips");

        const nodes = svg.selectAll('.node')
            .data(root.leaves())
            .enter().append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x0}, ${d.y0})`);

        nodes.append('rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .style('fill', (d, i) => color(i))
            .on('mouseover', function(event, d) {
                tooltips.transition().duration(200)
                    .style('opacity', 1)
                    .style("border-left", `5px solid ${color(d.index)}`);

                tooltips.html(`<h4>${d.data['Risk Factor']}</h4><p>Deaths: ${d.data.NumberOfDeath.toLocaleString()}</p>`)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY + 10}px`)
                    .style("transform", "translateY(0)"); // Reset translation for smooth display
            })
            .on('mouseout', function() {
                tooltips.transition().duration(200)
                    .style('opacity', 0)
                    .style("transform", "translateY(10px)"); // Slight downward translation for exit effect
            });

        createLegend(data, color);
    }).catch(function(error) {
        console.error('Error loading the CSV data:', error);
    });
}

function createLegend(data, colorScale) {
    const legendContainer = d3.select("#death_factor_legend")
        .style("display", "flex")
        .style("flex-direction", "column"); // Make legend items vertical

    data.forEach((d, i) => {
        const legendItem = legendContainer.append("div")
            .attr("class", "legend-item")
            .style("margin-bottom", "8px") // Add spacing between items
            .style("display", "flex")
            .style("align-items", "center");

        legendItem.append("div")
            .attr("class", "legend-color")
            .style("width", "20px")
            .style("height", "20px")
            .style("margin-right", "10px") // Spacing between color and text
            .style("background-color", colorScale(i));

        legendItem.append("span")
            .text(d['Risk Factor'])
            .style("font-size", "14px");
    });
}

death_factor();
