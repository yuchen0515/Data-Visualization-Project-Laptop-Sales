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
//     INIT BUBBLE CHART      //
// ---------------------------//
dataset.then(datas=>{
    drawBubbleChart(dataByBrand(datas));
});

// ---------------------------//
//       SORT  FUNCTIONS      //
// ---------------------------//
var dataByBrand = function(datas)
{
    let dataset_by_brands = Object()
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
    return dataset_by_brands;
}

var dataByPrice = function(datas, min_price, max_price)
{
    let dataset_by_Price = [];
    for (let value of datas)
    {
        if (value.latest_price >= min_price && value.latest_price <= max_price)
        {
            dataset_by_Price.push(value);
        }
    };
    return dataset_by_Price;
}

// ---------------------------//
//      DRAW BUBBLE CHART     //
// ---------------------------//
var drawBubbleChart = function(datas)
{
    // radius scale
    var rScale = d3.scaleLinear()
                   .domain([0, d3.max(d3.entries(datas), d => d.value)])
                   .range([50, 70])

    var nodes = Array();
    for (let [key, value] of Object.entries(datas))
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
    bubbleChart.selectAll("circle").remove();
    bubbleChart.selectAll("text").remove();

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
}

// ---------------------------//
//       PRICE INTERVAL       //
// ---------------------------//
var priceSlider1 = document.getElementById("pSlider1");
var priceSlider2 = document.getElementById("pSlider2");

dataset.then(datas=>{
    let maxValue = 0;
    for( const [key, value] of Object.entries(datas))
    {
        if (value.latest_price > maxValue)
        {
            maxValue = value.latest_price;
        }
    }
    // Set minimun price interval
    {
        priceSlider1.max = maxValue;
        priceSlider1.value=Math.min(priceSlider1.value,priceSlider1.parentNode.childNodes[5].value-1);
        var ratio = 100/(Number(priceSlider1.max)-Number(priceSlider1.min));
        var value=(ratio)*Number(priceSlider1.value)-(ratio)*Number(priceSlider1.min);
        var children = priceSlider1.parentNode.childNodes[1].childNodes;
        children[1].style.width=value+'%';
        children[5].style.left=value+'%';
        children[7].style.left=value+'%';children[11].style.left=value+'%';
        children[11].childNodes[1].innerHTML=priceSlider1.value; 
    }
    // Set maximun price interval
    {
        priceSlider2.max = maxValue;
        priceSlider2.value=maxValue;
        var ratio = 100/(Number(priceSlider2.max)-Number(priceSlider2.min)); 
        var value=(ratio)*Number(priceSlider2.value)-(ratio)*Number(priceSlider2.min);
        var children = priceSlider2.parentNode.childNodes[1].childNodes;
        children[3].style.width=(100-value)+'%';
        children[5].style.right=(100-value)+'%';
        children[9].style.left=value+'%';children[13].style.left=value+'%';
        children[13].childNodes[1].innerHTML=priceSlider2.value;
    }
})

// onchange of minimun price interval
priceSlider1.oninput = function()
{
    this.value=Math.min(this.value,this.parentNode.childNodes[5].value-1);
    var ratio = 100/(Number(this.max)-Number(this.min));
    var value=(ratio)*Number(this.value)-(ratio)*Number(this.min);
    var children = this.parentNode.childNodes[1].childNodes;
    children[1].style.width=value+'%';
    children[5].style.left=value+'%';
    children[7].style.left=value+'%';children[11].style.left=value+'%';
    children[11].childNodes[1].innerHTML=this.value; 
}

// onchange of maximun price interval
priceSlider2.oninput = function()
{
    this.value=Math.max(this.value,this.parentNode.childNodes[3].value-(-1));
    var ratio = 100/(Number(this.max)-Number(this.min)); 
    var value=(ratio)*Number(this.value)-(ratio)*Number(this.min);
    var children = this.parentNode.childNodes[1].childNodes;
    children[3].style.width=(100-value)+'%';
    children[5].style.right=(100-value)+'%';
    children[9].style.left=value+'%';children[13].style.left=value+'%';
    children[13].childNodes[1].innerHTML=this.value;
}

var debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
        var context = this, args = arguments;
        var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(context, args);
        return result;
    };
};

// on update minimun value
priceSlider1.onchange = debounce(()=>{
    dataset.then(datas=>{
        drawBubbleChart(dataByBrand(dataByPrice(datas, priceSlider1.value, priceSlider2.value)));
    });
})

// on update maximun value
priceSlider2.onchange = debounce(()=>{
    dataset.then(datas=>{
        drawBubbleChart(dataByBrand(dataByPrice(datas, priceSlider1.value, priceSlider2.value)));
    });
})

