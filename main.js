// STEP 1: data processing
var dataset = d3.csv("Cleaned_Laptop_data.csv", function(d) {
    return {
        brand:              d.brand,
        model:              d.model,
        processor_brand:    d.processor_brand,
        processor_name:     d.processor_name,
        processor_gnrtn:    d.processor_gnrtn,
        ram_gb:             Number(d.ram_gb),
        ram_type:           d.ram_type,
        ssd:                Number(d.ssd),
        hdd:                Number(d.hdd),
        os:                 d.os,
        os_bit:             Number(d.os_bit),
        graphic_card_gb:    Number(d.graphic_card_gb),
        weight:             d.weight,
        display_size:       Number(d.display_size),
        warranty:           Number(d.warranty),
        Touchscreen:        d.Touchscreen,
        msoffice:           d.msoffice,
        latest_price:       Number(d.latest_price),
        old_price:          Number(d.old_price),
        discount:           Number(d.discount),
        star_rating:        Number(d.star_rating),
        ratings:            Number(d.ratings),
        reviews:            Number(d.reviews),
    };
});

// document.write("Please look up the console output~")
// console.log(dataset);

const MARGIN = {left:100, right:10, top:10, bottom:100},
    WIDTH = 1000 - MARGIN.left - MARGIN.right,
    HEIGHT = 1000 - MARGIN.top - MARGIN.bottom,
    padding = 1.5, // seperation between same-color circles
    clusterpadding = 6. // seperation between different-color circles

const svg = d3.select("#chart-area").append("svg")
            .attr("width", WIDTH + MARGIN.left + MARGIN.right)
            .attr("height", HEIGHT + MARGIN.top + MARGIN.bottom)

// ---------------------------//
//        BUBBLE CHART        //
// ---------------------------//

const bubbleChart = svg.append("g")
                       .attr("transform", `translate(${MARGIN.left},${MARGIN.right})`)

// ---------------------------//
//       AXIS AND SCALE       //
// ---------------------------//

// X scale
// var xScale = d3.scaleLinear()
//                .domain(d3.extent())

// Y scale
// var yScale = d3.scaleLinear()
//                .domain(d3.extent())

// ---------------------------//
//         BUBBLE NODES       //
// ---------------------------//

let pack = d3.pack()
             .size([WIDTH,HEIGHT])

let dataset_by_brands = Object()
dataset.then(datas=>{
    for (let [key, value] of Object.entries(datas))
    {
        if (!(value.brand in dataset_by_brands))
        {
            dataset_by_brands[value.brand] = 1
        }
        else
        {
            dataset_by_brands[value.brand]+=1
        }
    };

    // radius scale
    var rScale = d3.scaleLinear()
                   .domain([0, d3.max(d3.entries(dataset_by_brands), d => d.value)])
                   .range([50, 100])

    var nodes = Array();
    for (let [key, value] of Object.entries(dataset_by_brands))
    {
        console.log(rScale(value))
        let obj = {cluster: key, radius: rScale(value)}
        nodes.push(obj)
    };

    console.log(nodes)
    
    // ---------------------------//
    //     FORCE SIMULATION       //
    // ---------------------------//

    var simulation = d3.forceSimulation(nodes)
                  .force('charge', d3.forceManyBody().strength(5))
                  .force('center', d3.forceCenter(WIDTH / 2, HEIGHT / 2))
                  .force('collision', d3.forceCollide().radius(d=>d.radius))
                  .on('tick', ticked);   


    // ---------------------------//
    //           BUBBLES          //
    // ---------------------------//

    const circles = bubbleChart.selectAll('.node')
                    .data(nodes)
                    .enter()
                    .append("circle")
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y)
                    .attr('r', d => d.radius)
                    .attr('fill', 'blue')

    const labels = bubbleChart.selectAll('.label')
               .data(nodes)
               .enter()
               .append('text')
               .attr('x', d => d.x)
               .attr('y', d => d.y)
               .attr('dy', ".5em")
               .attr('text-anchor', 'middle')
               .attr('fill', 'white')
               .style('font-size',d => String(d.r/2)+"px")
               .text(d => d.cluster)

    function ticked()
    {
        // console.log(nodes)
        circles
                    // .data(nodes)
                    // .join('circle')
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y)
                    // .attr('r', d => d.r)
                    // .attr('fill', 'blue')

        labels
          .attr('x', d=>d.x)
          .attr('y', d=>d.y)
    
    }

})