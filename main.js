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

const MARGIN = {
    left: 100,
    right: 100,
    top: 100,
    bottom: 100
};

const WIDTH = 632 - MARGIN.left - MARGIN.right,
    HEIGHT = 816 - MARGIN.top - MARGIN.bottom,
    padding = 1.5,      // seperation between same-color circles
    clusterpadding = 6. // seperation between different-color circles

const svg = d3.select(".bubble-box").append("svg")
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
                   .range([50, 70])

    var nodes = Array();
    for (let [key, value] of Object.entries(dataset_by_brands))
    {
        let obj = {cluster: key, radius: (value)}
        nodes.push(obj)
    };

    // color scale
    var brands = nodes.map(function(d) { return d.cluster });
    brands = d3.set(brands).values();

    var brandColor = d3.scaleOrdinal()
        .domain(brands)
        .range(d3.schemeAccent);
    
    // ---------------------------//
    //     FORCE SIMULATION       //
    // ---------------------------//
    var yfScale = d3.scaleThreshold()
                    .domain([0,10 ,50 ,100 ,200])
                    .range([900, 700, 400, 100])

    // y force scale
    var yfScale = d3.scaleThreshold()
                    .domain([0,10 ,50 ,100 ,200])
                    .range([900, 700, 400, 100])

    var simulation = d3.forceSimulation(nodes)
                  .force('charge', d3.forceManyBody().strength(70))
                  .force('center', d3.forceCenter(WIDTH/2, HEIGHT/2)   )
                  .force('yForce', d3.forceY(d=>yfScale(d.radius)).strength(0.01))
                  .force('collision', d3.forceCollide().radius(d=>rScale(d.radius)))
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
                    .attr('r', d => rScale(d.radius))
                    .attr("fill", function (d) {
                        return brandColor(d.cluster);
                    } )
                    .style("opacity", "0.6")

    const labels = bubbleChart.selectAll('.label')
               .data(nodes)
               .enter()
               .append('text')
               .attr('x', d => d.x)
               .attr('y', d => d.y)
               .attr('dy', "0.4em")
               .attr('text-anchor', 'middle')
               .attr('fill', 'white')
               .style('font-size',d => rScale(d.radius)-35+"px")
               .text(d => d.cluster)

    function ticked()
    {
        circles
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)

        labels
          .attr('x', d=>d.x)
          .attr('y', d=>d.y)
    }
});
