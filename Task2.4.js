// Set global variables for dimensions and SVG container
var w = 500;
var h = 150;
var margin = { top: 20, right: 20, bottom: 30, left: 40 };
var svg1, svg2, svg3;

// Function to create SVG containers dynamically
function createSVG(containerId) {
    return d3.select(containerId)
             .append("svg")
             .attr("width", w + margin.left + margin.right)
             .attr("height", h + margin.top + margin.bottom)
             .append("g")
             .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}

// Function to create the wombat sightings bar chart (chart 1)
function barChart1(wombatSightings) {
    // Set scales
    var xScale = d3.scaleBand()
                    .domain(d3.range(wombatSightings.length))
                    .range([0, w])
                    .paddingInner(0.05);
    var yScale = d3.scaleLinear()
                    .domain([0, d3.max(wombatSightings, function(d) { return d.wombats; })])
                    .range([h, 0]);

    // Draw the bars
    svg1.selectAll("rect")
        .data(wombatSightings)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
            return xScale(i);
        })
        .attr("y", function(d) {
            return yScale(d.wombats);
        })
        .attr("width", xScale.bandwidth())
        .attr("height", function(d) {
            return h - yScale(d.wombats);
        })
        .attr("fill", function(d) {
            // Change bar color based on data value
            if (d.wombats < 10) {
                return "rgb(0, 0, 139)"; // Dark blue for smaller values
            } else if (d.wombats >= 10 && d.wombats < 20) {
                return "rgb(0, 0, 255)"; // Medium blue for moderate values
            } else {
                return "rgb(0, 100, 255)"; // Light blue for larger values
            }
        });

    // Add X-axis
    var xAxis = d3.axisBottom(xScale)
                    .tickFormat(function(d, i) { return i + 1; });
    svg1.append("g")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis);

    // Add Y-axis
    var yAxis = d3.axisLeft(yScale).ticks(5); // Customize number of ticks if necessary
    svg1.append("g").call(yAxis);
    
    // Add labels on bars
    svg1.selectAll(".label")
        .data(wombatSightings)
        .enter()
        .append("text")
        .attr("class", "label")
        .text(function(d) { return d.wombats; })
        .attr("x", function(d, i) {
            return xScale(i) + xScale.bandwidth() / 2; // Centered on the bar
        })
        .attr("y", function(d) {
            return yScale(d.wombats) - 5; // Positioned slightly above the bar
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "black");
}


// Function to create the pet ownership bar chart (chart 2)
function barChart2(pet_ownership, year, svg) {
    var xScale = d3.scaleBand()
                    .domain(pet_ownership.map(d => d.animal))
                    .range([0, w])
                    .paddingInner(0.05);
    
    var yScale = d3.scaleLinear()
                    .domain([0, d3.max(pet_ownership, function(d) { return d[year]; })])
                    .range([h, 0]);
    
    svg.selectAll("rect")
        .data(pet_ownership)
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return xScale(d.animal);
        })
        .attr("y", function(d) {
            return yScale(d[year]);
        })
        .attr("width", xScale.bandwidth())
        .attr("height", function(d) {
            return h - yScale(d[year]);
        })
        .attr("fill", function(d) {
            if (d[year] < 10) {
                return "rgb(0, 0, 139)"; 
            } else if (d[year] >= 10 && d[year] < 20) {
                return "rgb(0, 0, 255)"; 
            } else {
                return "rgb(0, 100, 255)";
            }
        });

    var xAxis = d3.axisBottom(xScale);
    svg.append("g")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis)
        .selectAll("text")   
        .style("fill", "green");  // Change the label color to green

    var yAxis = d3.axisLeft(yScale).ticks(5); 
    svg.append("g").call(yAxis);

    svg.selectAll(".label")
        .data(pet_ownership)
        .enter()
        .append("text")
        .attr("class", "label")
        .text(function(d) { return d[year]; })
        .attr("x", function(d, i) {
            return xScale(d.animal) + xScale.bandwidth() / 2; // Centered on the bar
        })
        .attr("y", function(d) {
            return yScale(d[year]) - 5; // Positioned slightly above the bar
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "black");
}

function init() {
    // Create SVG containers
    svg1 = createSVG("#chart1");
    svg2 = createSVG("#chart2");
    svg3 = createSVG("#chart3");

    // Load the CSV file
    d3.csv("Task_2.4_data.csv").then(function(data) {
        // Convert data values to numbers
        data.forEach(function(d) {
            d.wombats = +d.wombats; // Ensure wombats is a number
        });
        console.log(data); // Check if the data is loaded properly
        barChart1(data); // Call the barChart function with the loaded data
    }).catch(function(error) {
        console.error('Error loading CSV file for chart 1:', error);
    });

    // Load the CSV file for chart 2 & 3
    d3.csv("pet_ownership.csv").then(function(data) {
        data.forEach(function(d) {
            d.pets2019 = +d.pets2019; 
            d.pets2021 = +d.pets2021; 
        });
        console.log(data); 
        barChart2(data, "pets2019", svg2);
        barChart2(data, "pets2021", svg3);
    }).catch(function(error) {
        console.error('Error loading CSV file for chart 2 & 3:', error);
    });
}

window.onload = init;