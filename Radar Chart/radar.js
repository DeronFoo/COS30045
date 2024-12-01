// Function to create the disease radar chart for a selected country
function disease_SEA(country) {
    if (country === "none" || !country) {  // Check for invalid selection
        return;  // Do nothing if no country is selected
    }

    const fileName = `Radar Chart/diseases_data_SEA/${country}.csv`;

    d3.csv(fileName).then(data => {
        const width = 700, height = 500; // Increase height for legend
        const svg = d3.select("#disease_SEA_chart")
            .html("") // Clear the previous chart
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const radius = Math.min(width, height - 100) / 2 - 50;
        const radialScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);
        const angleSlice = (Math.PI * 2) / data.length;

        const centerX = width / 2;
        const centerY = (height - 100) / 2; // Adjust center for legend space

        // Tooltip for displaying information on hover
        const tooltip = d3.select("body").append("div")
            .attr("id", "tooltip")
            .style("position", "absolute")
            .style("background-color", "#fff")
            .style("padding", "8px")
            .style("border-radius", "5px")
            .style("box-shadow", "0px 0px 5px rgba(0, 0, 0, 0.3)")
            .style("display", "none");

        // Draw circular grid lines
        [20, 40, 60, 80, 100].forEach(level => {
            svg.append("circle")
                .attr("cx", centerX)
                .attr("cy", centerY)
                .attr("r", radialScale(level))
                .attr("fill", "none")
                .attr("stroke", "gray")
                .attr("opacity", 0.5);

            svg.append("text")
                .attr("x", centerX + 5)
                .attr("y", centerY - radialScale(level))
                .attr("dy", "0.35em")
                .attr("fill", "gray")
                .text(level);
        });

        // Draw axis lines and labels
        data.forEach((d, i) => {
            const angle = angleSlice * i;
            const x = centerX + Math.cos(angle) * (radius + 30);
            const y = centerY - Math.sin(angle) * (radius + 30);

            svg.append("line")
                .attr("x1", centerX)
                .attr("y1", centerY)
                .attr("x2", centerX + Math.cos(angle) * radius)
                .attr("y2", centerY - Math.sin(angle) * radius)
                .attr("stroke", "gray")
                .attr("stroke-width", 1);

            svg.append("text")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", "0.35em")
                .style("text-anchor", angle > Math.PI ? "end" : "start")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .text(d.Cause);
        });

        const colors = ["blue", "orange"];
        const seriesKeys = ["Attributable to air pollution", "Non-air pollution related"];

        function getPath(dataSeries) {
            return data.map((d, i) => {
                const angle = angleSlice * i;
                const value = +d[dataSeries];
                const r = radialScale(value);
                const x = centerX + Math.cos(angle) * r;
                const y = centerY - Math.sin(angle) * r;
                return { x, y, cause: d.Cause, value };
            });
        }

        // Draw the orange series first
        let orangePoints = getPath(seriesKeys[1]);
        svg.append("path")
            .datum(orangePoints)
            .attr("d", d3.line()
                .x(d => d.x)
                .y(d => d.y)
                .curve(d3.curveLinearClosed))
            .attr("fill", colors[1])
            .attr("fill-opacity", 0)
            .attr("stroke", colors[1])
            .attr("stroke-width", 2);

        orangePoints.forEach(({ x, y, cause, value }) => {
            const circle = svg.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 4) // Initial radius
                .attr("fill", colors[1])
                .on("mouseover", (event) => {
                    circle.attr("r", 6); // Increase radius on hover
                    handleMouseOver(event, { cause, value });
                })
                .on("mouseout", () => {
                    circle.attr("r", 4); // Reset radius on mouseout
                    handleMouseOut();
                });
        });

        // Draw blue series on top
        let bluePoints = getPath(seriesKeys[0]);
        svg.append("path")
            .datum(bluePoints)
            .attr("d", d3.line()
                .x(d => d.x)
                .y(d => d.y)
                .curve(d3.curveLinearClosed))
            .attr("fill", colors[0])
            .attr("fill-opacity", 0)
            .attr("stroke", colors[0])
            .attr("stroke-width", 2);

        bluePoints.forEach(({ x, y, cause, value }) => {
            const circle = svg.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 4) // Initial radius
                .attr("fill", colors[0])
                .on("mouseover", (event) => {
                    circle.attr("r", 6); // Increase radius on hover
                    handleMouseOver(event, { cause, value });
                })
                .on("mouseout", () => {
                    circle.attr("r", 4); // Reset radius on mouseout
                    handleMouseOut();
                });
        });

        // Tooltip event handlers
        function handleMouseOver(event, d) {
            const [tooltipX, tooltipY] = d3.pointer(event);
            tooltip.html(`
                <strong>Disease:</strong> ${d.cause}<br>
                <strong>Percentage:</strong> ${d.value}%`
            )
            .style("display", "block")
            .style("left", (tooltipX + 15) + "px")
            .style("top", (tooltipY - 20) + "px");
        }

        function handleMouseOut() {
            tooltip.style("display", "none");
        }

        // Legend below chart
        const legend = svg.append("g")
            .attr("transform", `translate(${width / 2 - 60}, ${height - 60})`);

        seriesKeys.forEach((key, idx) => {
            legend.append("circle")
                .attr("cx", 10)
                .attr("cy", 10 + idx * 20)
                .attr("r", 6)
                .style("fill", colors[idx]);

            legend.append("text")
                .attr("x", 20)
                .attr("y", 10 + idx * 20)
                .attr("dy", "0.35em")
                .style("font-size", "12px")
                .text(key);
        });

    }).catch(error => console.error("Error loading CSV:", error));
}

function populate_table(country) {
    if (!country || country === "none") {
        alert("Please select a valid country from the dropdown.");
        return;
    }

    const fileName = `Radar Chart/diseases_data_SEA/${country}.csv`;

    d3.csv(fileName).then(data => {
        const tableBody = document.querySelector("#data_table tbody");
        tableBody.innerHTML = ""; // Clear any existing rows

        // Populate table rows
        data.forEach(row => {
            const tr = document.createElement("tr");
            Object.values(row).forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });

        // Adjust layout for table display
        document.querySelector("#disease_SEA_table_container").style.display = "block";


        // Download CSV button event listener
        document.getElementById('download_data_btn').addEventListener('click', () => {
            download_csv(data, country);
        });
    }).catch(error => {
        console.error("Error loading CSV for table:", error);
        alert("Failed to load data. Please ensure the file exists and try again.");
    });
}

function download_csv(data, country) {
    const csvContent = d3.csvFormat(data); // Convert data to CSV format
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download   
   = `${country}_data.csv`;
  
    // Simulate a click to trigger the download
    link.click();
  
    // Clean up the URL object
    URL.revokeObjectURL(link.href);
  }  

disease_SEA("malaysia"); 
populate_table("malaysia");

// Listen for change in country selection
d3.select("#disease_SEA_dropdown").on("change", function () {
    const selectedCountry = this.value;
    disease_SEA(selectedCountry);  // Update chart based on selected country
    populate_table(selectedCountry);
});
