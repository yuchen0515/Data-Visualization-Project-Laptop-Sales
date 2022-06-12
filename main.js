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

const WIDTH = 944 - MARGIN.left - MARGIN.right,
    HEIGHT = 816 - MARGIN.top - MARGIN.bottom,
    padding = 1.5,      // seperation between same-color circles
    clusterpadding = 6. // seperation between different-color circles

const price_step = 5000;

const svg = d3.select("#bubble-chart").append("svg")
            .attr("width", WIDTH + MARGIN.left + MARGIN.right)
            .attr("height", HEIGHT + MARGIN.top + MARGIN.bottom)


// ---------------------------//
//        BUBBLE CHART        //
// ---------------------------//
const bubbleChart = svg.append("g")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .attr("transform", `translate(${MARGIN.left},${MARGIN.right})`)


// ---------------------------//
//       AXIS AND SCALE       //
// ---------------------------//

// X scale
// var xScale = d3.scaleOrdinal()
//                .domain(d3.extent(uniBrands()))
//                .range()

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
    var size = Object.keys(datas).length;

    for (let [key, value] of Object.entries(datas))
    {
        if (!(value.brand in dataset_by_brands))
        {
            dataset_by_brands[value.brand] = Object();
            dataset_by_brands[value.brand].total = 0;
            dataset_by_brands[value.brand].brandTotal = size;
            dataset_by_brands[value.brand].brand_data = Object();
        }
        dataset_by_brands[value.brand].total += 1;
        
        if (!(value.model in dataset_by_brands[value.brand].brand_data)) {
            dataset_by_brands[value.brand].brand_data[value.model] = 0;
        }
        dataset_by_brands[value.brand].brand_data[value.model] += 1;
    };

    return dataset_by_brands;
}

var dataByCPU = function(datas)
{
    let dataset_by_cpu = Object();
    for (let [key, value] of Object.entries(datas))
    {
        if (!(value.processor_brand in dataset_by_cpu))
        {
            dataset_by_cpu[value.processor_brand] = 1;
        }
        else
        {
            dataset_by_cpu[value.processor_brand]+=1;
        }
    };
    return dataset_by_cpu;
}

var dataByPrice = function(datas)
{
    let dataset_by_price = Object()
    for (let [key, value] of Object.entries(datas))
    {
        let rounded_price = Math.round(value.latest_price / price_step) * price_step;
        if (!(rounded_price in dataset_by_price))
        {
            dataset_by_price[rounded_price] = {[value.brand]:1};
        }
        else
        {
            if (value.brand in dataset_by_price[rounded_price])
                dataset_by_price[rounded_price][value.brand] += 1;
            else    
                dataset_by_price[rounded_price][value.brand] = 1;
        }
    };
    return dataset_by_price;
}

var dataByPriceInterval = function(datas, min_price, max_price)
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

var brandColor = d3.scaleOrdinal()
    .domain(dataset.then(function(data) {
        var brands = data.map(function(d) {return d.brand});
        brands = [...new Set(brands)];
        return brands;
    }))
    .range(d3.schemeAccent);

// ---------------------------//
//           TOOLTIP          //
// ---------------------------//
function setTooltip() {
    const tooltip = d3.tip()
                      .attr('class', 'd3-tip');

    tooltip.html(
        function(d) {

            var brandPercent = roundTwoFix(d.data.model_count * 100 / d.data.total);

            var str = `
                <center>
                    <h2>${d.cluster}</h2>
                </center>
                <center>count: ${d.data.model_count} / per. ${brandPercent} %
                <hr class="solid" />
                <table>
                    <tr>
                        <th> model </th>
                        <th> count(per.) </th>
                    </tr>
            `;  

            d.data.modelArray.forEach(function(el) {

                var modelPercent = roundTwoFix(el[1] * 100 / d.data.model_count);

                // <div>${el[0]}: ${el[1]} (${modelPercent} %)</div>
                str += `
                    <tr>
                        <td> ${el[0]}  </td>
                        <td> ${el[1]} (${modelPercent} %) </td>
                    </tr>
                `;

            })
            str += `
                </table>
            `

            return str;
        }
    )

    return tooltip;
}

const tooltip = setTooltip();
bubbleChart.call(tooltip);

function roundTwoFix(number) {
    return Math.round(number * 100) / 100;
}

var priceColor = function(datas) 
{
    let brand_color = brandColor(datas['brand']);
    brand_color = ["darkgrey", brand_color];
    
    let min_price_rounded = Math.round(priceSlider1.value / price_step) * price_step;
    let max_price_rounded = Math.round(priceSlider2.value / price_step) * price_step;
    let price_interval = [min_price_rounded, max_price_rounded];

    let pcScale = d3.scaleLinear().domain(price_interval)
                    .range(brand_color);

    return pcScale(parseInt(datas.cluster));
} 

// ---------------------------//
//      DRAW BUBBLE CHART     //
// ---------------------------//
var drawBubbleChart = function(datas)
{
    // radius scale
    var rScale = d3.scaleLinear()
                   .domain([0, d3.max(d3.entries(datas), d => d.value.total)])
                   .range([50, 70])

    var nodes = Array();

    for (let [key, value] of Object.entries(datas))
    {
        if (key == "undefined") {
            continue;
        }

        var brand_data = Object.entries(value.brand_data)
            .sort(function(a, b) {
                if (b[1] - a[1]) {
                    return b[1] - a[1];
                }
                if (a[0] == b[0]) {
                    return 0;
                }
                return a[0] >= b[0] ? 1 : -1;
            });

        let obj = {
            cluster: key,
            radius: (value.total),
            data: {
                modelArray: brand_data,
                model_count: value.total,
                total: value.brandTotal
            },
        };

        nodes.push(obj);
    };

    
    // ---------------------------//
    //     FORCE SIMULATION       //
    // ---------------------------//

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
    bubbleChart.selectAll(".xAxis").remove();
    bubbleChart.selectAll(".yAxis").remove();

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

var drawNumericBubbleChart = function(datas)
{
    let brand_list =  Object.values(datas).map(function(d) {return Object.keys(d)});
    let brand_location = [];
    brand_list = brand_list.reduce( (arr, val)=>{return arr.concat(val)}, []);
    brand_list = [...new Set(brand_list)];
    for (let i=0;i<=WIDTH;i+=WIDTH/brand_list.length) brand_location.push(i);
    
    var xScale = d3.scaleOrdinal()
               .domain(brand_list)
               .range(brand_location);

    bubbleChart.selectAll(".xAxis").remove();

    bubbleChart.append('g')
        .attr("class", "xAxis")
        .attr("transform", `translate(${MARGIN.left},${HEIGHT-MARGIN.bottom})`)
        .call(d3.axisBottom().scale(xScale));

    // radius scale
    var max_num = 0;
    for (let [key, value] of Object.entries(datas))
    {
        for ( let [k, val] of Object.entries(value))
        {
            max_num = Math.max(val, max_num);
        }
    }
    var rScale = d3.scaleLinear()
                   .domain([0, max_num])
                   .range([20, 30])

    var nodes = Array();
    for (let [key, value] of Object.entries(datas))
    {
        for ( let [k, val] of Object.entries(value))
        {
            let obj = {cluster: key, brand:k, radius: val};
            nodes.push(obj);
        }
    };

    // ---------------------------//
    //     FORCE SIMULATION       //
    // ---------------------------//
    let min_price_rounded = Math.round(priceSlider1.value / price_step) * price_step;
    let max_price_rounded = Math.round(priceSlider2.value / price_step) * price_step;
    let price_steps = [];
    for (let i=min_price_rounded;i<max_price_rounded;i+=price_step) price_steps.push(i);
    let price_location = [];
    for (let i=HEIGHT;i>=0;i-=HEIGHT/price_steps.length) price_location.push(i);

    // y force scale
    var yfScale = d3.scaleThreshold()
                    .domain(price_steps)
                    .range(price_location)

    var simulation = d3.forceSimulation(nodes)
                  .force('charge', d3.forceManyBody().strength(2))
                  .force('xForce', d3.forceX(d=>xScale(d.brand)).strength(2))
                  .force('yForce', d3.forceY(d=>yfScale(parseInt(d.cluster))).strength(2))
                //   .force('collision', d3.forceCollide().radius(d=>rScale(d.radius)))
                  .on('tick', ticked);   

    bubbleChart.selectAll(".yAxis").remove();

    bubbleChart.append('g')
        .attr("class", "yAxis")
        .attr("transform", `translate(${MARGIN.left},${0})`)
        .call(d3.axisLeft().scale(yfScale).ticks(20));

    // ---------------------------//
    //           BUBBLES          //
    // ---------------------------//
    bubbleChart.selectAll("circle").remove();
    bubbleChart.selectAll("text").remove();

    var showTooltip_Circle = function(d) {
        console.log(d)
        height = d.data.model_count
        tooltip
            .offset([rScale(d.radius) + height * 1.5 + 50, 2.3 * rScale(d.radius)]);

        tooltip.show(d);
    }

    const circles = bubbleChart.selectAll('.node')
                    .data(nodes)
                    .enter()
                    .append("circle")
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y)
                    .attr('r', d => rScale(d.radius))
                    .attr("fill", function (d) {
                        return priceColor(d);
                    } )
                    .style("opacity", "0.6")
                    .on("mouseover", showTooltip_Circle)
                    .on("mouseout", tooltip.hide)

    var showTooltip_Label = function(d) {
        tooltip
            .offset([height * 1.5 + 75, 2.3 * rScale(d.radius)]);

        tooltip.show(d);
    }

    const labels = bubbleChart.selectAll('.label')
               .data(nodes)
               .enter()
               .append('text')
               .attr('x', d => d.x)
               .attr('y', d => d.y)
               .attr('dy', "0.4em")
               .attr('text-anchor', 'middle')
               .attr('fill', 'white')
               .style('font-size',d => rScale(d.radius)-9+"px")
               .text(d => d.cluster)
               .on("mouseover", showTooltip_Label)
               .on("mouseout", tooltip.hide);

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

var drawChart = function(selected_tab, filterData)
{
    if (selected_tab == "brand")
    {
        drawBubbleChart(dataByBrand(dataByPriceInterval(filterData, priceSlider1.value, priceSlider2.value)));
    }
    else if (selected_tab == "cpu")
    {
        drawBubbleChart(dataByCPU(dataByPriceInterval(filterData, priceSlider1.value, priceSlider2.value)));
    }
    else if (selected_tab == "numeric")
    {
        drawNumericBubbleChart(dataByPrice(dataByPriceInterval(filterData, priceSlider1.value, priceSlider2.value)));
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


var drawCheckbox = function(brands) {
    var el = document.getElementById("controller-chart");

    brands.forEach(function(d, i) {
        var elCheckbox = document.createElement('brand-checkbox');

        var str = '<input type="checkbox" style="white-space:pre" class="brand-checkbox" value="' + d + '" name="brand_' + d + '" checked>';

        var textBackgroundColor = '<span style="background-color:';
        textBackgroundColor += brandColor(d);
        textBackgroundColor += ';">&emsp; &emsp; </span>';

        str += d;
        str += '&#9;';
        str += textBackgroundColor;
        str += '&emsp; &emsp; &#9;';

        if (i != 0 && (i + 1) % 2 == 0) {
            str += '<br>';
        }
        elCheckbox.innerHTML = str
        el.appendChild(elCheckbox);

    })
};


function filterByBrand(data, brands) {
    var datas = Array();
    data.forEach(function(d) {
        if (brands.indexOf(d.brand) !== -1) {
            datas.push(d);
        }
    });

    return datas;
};


function uniBrands(data) {
    var brands = data.map(function(d) {return d.brand});
    brands = [...new Set(brands)];
    return brands;
}


//update & listener
dataset.then(function(data) {
    var selected_tab = "brand";

    var brands = uniBrands(data);
    drawCheckbox(brands);
    var checkboxes = document.querySelectorAll('.brand-checkbox'); 

    checkboxes.forEach(function(c) {
        c.addEventListener('click', (event) => {
            if (c.checked === true) {
                brands.push(c.value);
            } else {
                var ind = brands.indexOf(c.value);
                brands.splice(ind, 1);
            }
            filterData = filterByBrand(data, brands);
            drawChart(selected_tab, filterData);
        }); 
    })

    //update tabs
    var tabs = document.querySelectorAll(".tabs_wrap ul li");
    tabs.forEach(tab=>{
        tab.addEventListener("click",()=>{
            
            tabs.forEach(tab=>{
                tab.classList.remove("activate");
            })
            tab.classList.add("activate");

            selected_tab = tab.getAttribute("data-tabs");

            filterData = filterByBrand(data, brands);
            drawChart(selected_tab, filterData);
        });
    })


    // update minimun value
    priceSlider1.onchange = debounce(()=>{
        filterData = filterByBrand(data, brands);
        drawChart(selected_tab, filterData);
    })

    // update maximun value
    priceSlider2.onchange = debounce(()=>{
        filterData = filterByBrand(data, brands);
        drawChart(selected_tab, filterData);
    })
});
