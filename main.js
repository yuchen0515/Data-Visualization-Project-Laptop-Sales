// STEP 1: data processing
var dataset = d3.csv("highPollution.csv", function(d) {
    return {
        siteID:     d.siteID,
        day:        Number(d.day),
        hour:       Number(d.hour),
        year:       Number(d.year),
        month:      Number(d.month),
        weekday:    Number(d.weekday),
        gps_lat:    Number(d.gps_lat),
        gps_lon:    Number(d.gps_lon),
        value:      JSON.parse(d.value),
        umapX:      Number(d.umapX),
        umapY:      Number(d.umapY),
    };
});


// STEP 2: scatter plot
function drawScatterPlot(data) {
    const LEFT = 0, TOP = 0;
    const TOTAL_WIDTH = 500, TOTAL_HEIGHT = 400;

    const MARGIN = {
        LEFT: 100,
        RIGHT: 30,
        TOP: 10,
        BOTTOM: 30
    };

    const WIDTH = TOTAL_WIDTH - MARGIN.LEFT - MARGIN.RIGHT;
    const HEIGHT = TOTAL_HEIGHT - MARGIN.TOP - MARGIN.BOTTOM;

    const svg = d3.select("#chart-area")
        .select('#scatter-chart')
        .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
        .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM);

    const g = svg.append("g")
        .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`);

    var tip = d3.tip()
                .attr('class', 'd3-tip')
                .html(d=>("Day: " + d.day + "<br>" +
                          "Hour: " + d.hour + "<br>" +
                          d.value.map(function(e) {
                              return parseInt(e);
                          }).join(','))
                );

    var brush = d3.brush()
        .extent([[0, 0], [WIDTH, HEIGHT]])
        .on("start", brushed)
        .on("brush", brushed)
        .on("end", endbrushed);
    
    function brushed() {
        totalData = [];
        var extent = d3.event.selection;
        circles
            .classed("selected", function(d) { 
                selected = xScale(d.umapX) >= extent[0][0] && 
                    xScale(d.umapX) <= extent[1][0] && 
                    yScale(d.umapY) >= extent[0][1] && 
                    yScale(d.umapY) <= extent[1][1];

                if (selected) {
                    totalData.push(d);
                }
                return selected;
            });
    }

    function endbrushed() {
        switchBool = true;

        if (totalData.length == 0) {
            totalData = data;
        }

        var lineChart = d3.select("#chart-area")
            .select("#line-chart")

        lineChart.selectAll('path').remove();
        lineChart.selectAll('text').remove();

        drawLineChart(totalData);

        var barChart = d3.select("#chart-area")
            .select("#bar-chart");

        barChart.selectAll('rect').remove();
        barChart.selectAll('text').remove();
        barChart.selectAll('path').remove();
        barChart.selectAll('line').remove();

        drawBarChart(totalData);

        d3.json("taiwan.json").then(drawTaiwanMark);
    }

    g.call(tip);

    var xScale = d3.scaleLinear()
        .domain(d3.extent(data, d=>d.umapX))
        .range([0, WIDTH]);

    var yScale = d3.scaleLinear()
        .domain(d3.extent(data, d=>d.umapY))
        .range([HEIGHT, 0]);

    var colorScale = d3.scaleSequential()
        .domain(d3.extent(data, d=>d3.mean(d.value)))
        .interpolator(d3.interpolateReds);


    g.append("g")
        .attr("transform", "translate(0," + HEIGHT + ")")
        .call(d3.axisBottom(xScale).tickFormat(""));

    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(""));

    var totalG = g.append("g");

    var brushG = totalG.append("g")
        .call(brush);

    var circleG = totalG.append("g");
    var circles = circleG.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function(d, i) {
            return xScale(d.umapX);
        })
        .attr("cy", function(d, i) {
            return yScale(d.umapY);
        })
        .attr("r", function(d) {
            return 1.8;
        })
        .attr("fill", (d)=>colorScale(d3.mean(d.value)));

    circles
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
}


// STEP 3: Line chart
function drawLineChart(data) {
    const LEFT = 0, TOP = 450;
    const TOTAL_WIDTH = 600, TOTAL_HEIGHT = 120;

    const MARGIN = {
        LEFT: 100,
        RIGHT: 30,
        TOP: 10,
        BOTTOM: 40
    };

    const WIDTH = TOTAL_WIDTH - MARGIN.LEFT - MARGIN.RIGHT;
    const HEIGHT = TOTAL_HEIGHT - MARGIN.TOP - MARGIN.BOTTOM;

    var series = [];

    data.forEach(function(d, i) {
        var element = [];
        d.value.forEach(function(d, i) {
            element.push({
                value: d,
                index: i - 3
            })
        })
        series.push(element);
    });

    const svg = d3.select("#chart-area")
        .select("#line-chart")
        .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
        .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)

    const g = svg.append("g")
        .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)

    var xScale = d3.scaleLinear()
        .domain([-3, 3])
        .range([0, WIDTH]);

    var yScale = d3.scaleLinear()
        .domain([0, 95])
        .range([HEIGHT, 0]);

    g.append("g")
        .attr("transform", "translate(0," + HEIGHT + ")")
        .call(d3.axisBottom(xScale).ticks(6));

    g.append("g")
        .call(d3.axisLeft(yScale));               

    var lineGenerator = d3.line()
        .x(function(data) {
            return xScale(data.index);
        })
        .y(function(data) {
            return yScale(data.value);
        });

    g.selectAll("path")
        .data(series)
        .enter()
        .append("path")
        .transition()
        .duration(25)
        .style('opacity', 0.1)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);

    g.append("text")
        .attr("x", WIDTH / 2)
        .attr("y", HEIGHT + 30)
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .text("Local Time (hour)");

    g.append("text")
        .attr("x", - (HEIGHT / 2))
        .attr("y", -40)
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("PM2.5");
}


// STEP 4: Bar chart
function drawBarChart(data) {
    const LEFT = 0, TOP = 500;
    const TOTAL_WIDTH = 1000, TOTAL_HEIGHT = 150;

    const MARGIN = {
        LEFT: 100,
        RIGHT: 30,
        TOP: 30,
        BOTTOM: 50
    };

    const WIDTH = TOTAL_WIDTH - MARGIN.LEFT - MARGIN.RIGHT;
    const HEIGHT = TOTAL_HEIGHT - MARGIN.TOP - MARGIN.BOTTOM;

    var countDevice = generateCountDevice(data);

    const svg = d3.select("#chart-area")
        .select("#bar-chart")
        .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
        .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM);

    const g = svg.append("g")
        .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`);

    var brush = d3.brushX()
        .extent([[0, 0], [WIDTH, HEIGHT]])
        .on("start", brushed)
        .on("brush", brushed)
        .on("end", endbrushed);

    function brushed() {
        selectData = [];
        var extent = d3.event.selection;
        rects
            .classed("selected", function(d) { 
                selected = x(new Date(d.date)) >= extent[0] && 
                    x(new Date(d.date)) <= extent[1]

                if (selected) {
                    selectData.push(d);
                }
                return selected;
            });
    }

    function endbrushed() {
        switchBool = false;

        if (selectData.length == 0) {
            selectData = totalData;
        }

        d3.json("taiwan.json").then(drawTaiwanMark);
    }

    var startDate = new Date(0, 0, 18, 4);
    var endDate = new Date(0, 0, 24, 21);

    var x = d3.scaleBand()
        .domain(d3.timeHours(startDate, endDate, 1))
        .range([0, WIDTH])
        .paddingInner(0.1)
        .paddingOuter(0.2);

    var xAxis = d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%d-%H"))
        .tickValues(d3.timeHours(startDate, endDate, 2));

    var m = 0;
    countDevice.forEach(function(d) {
        m = Math.max(d.value, m);
    })

    var yScale = d3.scaleLinear()
        .domain([0, m])
        .range([HEIGHT, 0]);

    g.append("g")
        .call(d3.axisLeft(yScale)
            .ticks(6));

    var colorScale = d3.scaleSequential()
        .domain([0, 24])
        .interpolator(d3.interpolateBuGn);

    g.append("g")
        .attr("transform", "translate(0," + HEIGHT + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("x", -20)
        .attr("y", 5)
        .attr("transform", "rotate(-45)");

    g.append("text")
        .attr("x", WIDTH / 2)
        .attr("y", HEIGHT + 50)
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .text("Time");

    g.append("text")
        .attr("x", - (HEIGHT / 2))
        .attr("y", -40)
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Number of Devices");

    var rectG = g.append("g");
    var rects = rectG.selectAll("rect")
        .data(countDevice)
        .enter()
        .append("rect")
        .attr("x", (d) => x(new Date(d.date)))
        .attr("y", (d) => yScale(d.value))
        .attr("width", x.bandwidth)
        .attr("height", d => HEIGHT - yScale(d.value))
        .attr("fill", (d)=>colorScale(d.hour))
        .style("stroke", "black")
        .style("stroke-width", 1);

    rectG.call(brush);
}


function drawTaiwan(taiwan) {
    var width = 1000;
    var height = 800;

    var projection = d3.geoMercator()
        .fitExtent([[0,0], [width, height]], taiwan);

    var geoGenerator = d3.geoPath()
        .projection(projection);

    const svg = d3.select("#chart-area")
        .select("#taiwan-map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.selectAll('path')
        .data(taiwan.features)
        .enter()
        .append('path')
        .attr('class', 'road')
        .attr('stroke', "black")
        .attr('fill', 'none')
        .attr('d', geoGenerator);
}


function drawTaiwanMark(taiwan) {
    var width = 1000;
    var height = 800;

    var projection = d3.geoMercator()
        .fitExtent([[0,0], [width, height]], taiwan);

    var path = d3.select("#chart-area")
        .select("#taiwan-map")
        .selectAll(".position");

    if (switchBool == true) {
        selectData = totalData;
    }

    var update = path.data(selectData);
    var enter = update.enter();
    var exit = update.exit();

    update
        .attr('class', 'position')
        .attr('d', 'M 15 6 A 1 1 0 0 0 0 10 T 6 15 T 15 6')
        .attr('fill', 'orange')
        .attr("transform", function(d) {
            var x = projection([d.gps_lon, d.gps_lat])[0];
            var y = projection([d.gps_lon, d.gps_lat])[1];
            return "translate(" + x + "," + y + ")";
        });

    enter
        .append('path')
        .attr('class', 'position')
        .attr('d', 'M 15 6 A 1 1 0 0 0 0 10 T 6 15 T 15 6')
        .attr('fill', 'orange')
        .attr("transform", function(d) {
            var x = projection([d.gps_lon, d.gps_lat])[0];
            var y = projection([d.gps_lon, d.gps_lat])[1];
            return "translate(" + x + "," + y + ")";
        });

    exit.remove();
}


function generateCountDevice(data) {
    var dateMap = d3.map(data, function(d) {
        return new Date(0, 0, d.day, d.hour);
    });

    var deviceMap = d3.map(data, function(d){
        return d;
    });

    var scal = dateMap.keys();
    scal.forEach(function(d) {
        dateMap.set(d, {
            date: d,
            value: new Set()
        });
    })

    data.forEach(function(d) {
        var date = new Date(0, 0, d.day, d.hour);
        dateMap.get(date).hour = date.getHours();
        dateMap.get(date).value.add(d.siteID);
    });


    var countDevice = dateMap.values();
    countDevice.forEach(function(d) {
        d.value = d.value.size
    });

    return countDevice;
}


function generateCountDevice(data) {
    var dateMap = d3.map(data, function(d) {
        return new Date(0, 0, d.day, d.hour);
    });

    var deviceMap = d3.map(data, function(d){
        return d;
    });

    var scal = dateMap.keys();
    scal.forEach(function(d) {
        dateMap.set(d, {
            date: d,
            value: new Set()
        });
    })

    data.forEach(function(d) {
        var date = new Date(0, 0, d.day, d.hour);
        dateMap.get(date).hour = date.getHours();
        dateMap.get(date).value.add(d.siteID);
        dateMap.get(date).gps_lat = d.gps_lat;
        dateMap.get(date).gps_lon = d.gps_lon;
    });


    var countDevice = dateMap.values();
    countDevice.forEach(function(d) {
        d.value = d.value.size
    });

    return countDevice;
}


// RUN ALL FUNCTION
dataset.then(function(data) {
    switchBool = true;
    totalData = data;
    selectData = totalData;

    drawScatterPlot(data);
    drawLineChart(data);
    drawBarChart(data);
    d3.json("taiwan.json").then(drawTaiwan);
    d3.json("taiwan.json").then(drawTaiwanMark);
});
