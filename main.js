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
    top: -100,
    bottom: 100
};

const WIDTH = 944 - MARGIN.left - MARGIN.right,
    HEIGHT = 816 - MARGIN.top - MARGIN.bottom,
    padding = 1.5,      // seperation between same-color circles
    clusterpadding = 6. // seperation between different-color circles

const price_step = 20000;

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
    var size = Object.keys(datas).length;

    for (let [key, value] of Object.entries(datas))
    {
        if (!(value.processor_brand in dataset_by_cpu))
        {
            dataset_by_cpu[value.processor_brand] = Object();
            dataset_by_cpu[value.processor_brand].total = 0;
            dataset_by_cpu[value.processor_brand].brandTotal = size;
            dataset_by_cpu[value.processor_brand].cpu_data = Object();
        }
        dataset_by_cpu[value.processor_brand].total += 1;

        if (!(value.model in dataset_by_cpu[value.processor_brand].cpu_data)) {
            dataset_by_cpu[value.processor_brand].cpu_data[value.model] = Object();
            dataset_by_cpu[value.processor_brand].cpu_data[value.model].value = 0;
            dataset_by_cpu[value.processor_brand].cpu_data[value.model].brand = value.brand;
        }
        dataset_by_cpu[value.processor_brand].cpu_data[value.model].value += 1;
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

// var brandColor = d3.scale.category20b();
var color = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', 
             '#f58231', '#911eb4', '#42d4f4', '#f032e6',
             '#bfef45', '#fabed4', '#469990', '#dcbeff',
             '#9A6324', '#fffac8', '#800000', '#aaffc3',
             '#808000', '#ffd8b1',
             '#000075', '#a9a9a9', '#000000']
// console.log(color)
var brandColor = d3.scaleOrdinal()
    .domain(dataset.then(function(data) {
        var brands = data.map(function(d) {return d.brand});
        brands = [...new Set(brands)];
        return brands;
    }))
    .range(color);

// ---------------------------//
//           TOOLTIP          //
// ---------------------------//
function setTooltip() {
    const tooltip = d3.tip()
                      .attr('class', 'd3-tip');

    tooltip.html(
        function(d) {
            var type = "";

            if (typeof(d.data.modelArray[0][1]) == "number") {
                type = "brand";
            } else if (typeof(d.data.modelArray[0][1]) == "object") {
                type = "cpu";
            }

            var brandPercent = roundTwoFix(d.data.model_count * 100 / d.data.total);

            var str = `
                <center>
                    <h2>${d.cluster}</h2>
                </center>
                <center>count: ${d.data.model_count} / per. ${brandPercent} %
                <hr class="solid" />
            `;


            if (type == "brand") {
                str += `
                    <table>
                        <tr>
                            <th> model </th>
                            <th> count(per.) </th>
                        </tr>
                `;  

                d.data.modelArray.forEach(function(el) {

                    var modelPercent = roundTwoFix(el[1] * 100 / d.data.model_count);

                    str += `
                    <tr>
                        <td> ${el[0]}  </td>
                        <td> ${el[1]} (${modelPercent} %) </td>
                    </tr>
                `;

                })
            } else if (type == "cpu") {
                str += `
                    <table>
                        <tr>
                            <th> brand </th>
                            <th> model </th>
                            <th> count(per.) </th>
                        </tr>
                `;  
                cnt = 0
                otherRate = 0
                d.data.modelArray.forEach(function(el) {
                    cnt ++
                    var modelPercent = roundTwoFix(el[1].value * 100 / d.data.model_count);
                    
                    if(cnt < 35){
                        str += `
                            <tr>
                                <td> ${el[1].brand}  </td>
                                <td> ${el[0]}  </td>
                                <td> ${el[1].value} (${modelPercent} %) </td>
                            </tr>
                        `;
                    }
                    else{
                        otherRate += modelPercent
                    }
                })
                if(cnt > 35)
                    str += `
                    <tr>
                        <td colspan="2">
                            Other Model
                        </td>
                    
                        <td colspan="1"> ${ roundTwoFix(otherRate)} % </td>
                    </tr>
                `;
            }
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
                   .range([30, 120])

    var nodes = Array();
    var type = detDataBasedCatogory(datas);

    for (let [key, value] of Object.entries(datas))
    {
        if (key == "undefined") {
            continue;
        }

        let obj = {
            cluster: key,
            radius: (value.total)
        };

        if (type == "brand") {
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
            obj.data = {
                modelArray: brand_data,
                model_count: value.total,
                total: value.brandTotal
            }
        } else if (type == "cpu") {
            var cpu_data = Object.entries(value.cpu_data)
                .sort(function(a, b) {
                    if (b[1].value - a[1].value) {
                        return b[1].value - a[1].value;
                    }
                    if (a[0] == b[0]) {
                        return 0;
                    }
                    return a[0] >= b[0] ? 1 : -1;
                });
            obj.data = {
                modelArray: cpu_data,
                model_count: value.total,
                total: value.brandTotal
            }
        }
        nodes.push(obj);
    };

    drawHistogram(nodes);

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

    var showTooltip_Circle = function(d) {
        // console.log(d)
        height = Math.min(d.data.modelArray.length, 35)
        // console.log(rScale(d.radius))
        // console.log(height)
        // height = d.data.model_count
        // console.log(height)
        tooltip
            .offset([rScale(d.radius) + height * 10 + 50, 1.5 * rScale(d.radius) + 70]);
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
                            return brandColor(d.cluster);
                        } )
                        .style("opacity", "0.8")
                        .on("mouseover", showTooltip_Circle)
                        .on("mouseout", tooltip.hide)

    var showTooltip_Label = function(d) {
        tooltip
            .offset([height * 10 + 65, 1.5 * rScale(d.radius) + 70]);

        tooltip.show(d);
    }
    function isBright(color) {
        const hex = color.replace('#', '');
        const c_r = parseInt(hex.substr(0, 2), 16);
        const c_g = parseInt(hex.substr(2, 2), 16);
        const c_b = parseInt(hex.substr(4, 2), 16);
        const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
        return brightness > 155;
    }

    const labels = bubbleChart.selectAll('.label')
                .data(nodes)
                .enter()
                .append('text')
                .attr('x', d => d.x)
                .attr('y', d => d.y)
                .attr('dy', "0.4em")
                .attr('text-anchor', 'middle')
                // .attr('fill', 'white')
                .attr("fill", function (d) {
                    c = brandColor(d.cluster)
                    if(isBright(c)){
                        return 'black'
                    }
                    else{
                        return 'white'
                    }
                } )
                .style('font-size',d => rScale(d.radius) / 2 - 5+"px")
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

var drawNumericBubbleChart = function(datas)
{
    let brand_list =  Object.values(datas).map(function(d) {return Object.keys(d)});
    let brand_location = [];
    brand_list = brand_list.reduce( (arr, val)=>{return arr.concat(val)}, []);
    brand_list = [...new Set(brand_list)];
    // for (let i=0;i<=WIDTH;i+=WIDTH/brand_list.length) brand_location.push(i);

    var xS = d3.scaleBand()
        .domain(brand_list)
        .range([0,WIDTH]);

    bubbleChart.selectAll(".xAxis").remove();

    var xAxis = bubbleChart.append('g')
        .attr("class", "xAxis")
        .attr("transform", `translate(${0},${HEIGHT+MARGIN.top-MARGIN.bottom})`)
        .call(d3.axisBottom().scale(xS));

    xAxis.selectAll("text")
        .attr("class", "tick")
        .attr("x", -30)
        .attr("y", 10)
        .attr("fill", "black")
        .attr("transform", "rotate(-45)");;

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
        .range([7, 15])

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
    let max_price_rounded = Math.round(priceSlider2.value / price_step + 1) * price_step;
    let price_steps = [];
    for (let i=min_price_rounded;i<max_price_rounded;i+=price_step) price_steps.push(String(i));
    // let price_location = [];
    // for (let i=HEIGHT;i>=0;i-=HEIGHT/price_steps.length) price_location.push(i);

    // y force scale
    var yfScale = d3.scaleBand()
        .domain(price_steps)
        .range([HEIGHT+MARGIN.top-MARGIN.bottom,0])

    var simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody())
        .force('xForce', d3.forceX(d=>xS(d.brand)).strength(5))
        .force('yForce', d3.forceY(d=>yfScale(d.cluster)).strength(5))
    //   .force('collision', d3.forceCollide().radius(d=>rScale(d.radius)))
        .on('tick', ticked);   

    bubbleChart.selectAll(".yAxis").remove();

    var yAxis = bubbleChart.append('g')
        .attr("class", "yAxis")
        .attr("transform", `translate(${-20},${0})`)
        .call(d3.axisLeft(yfScale));

    yAxis.selectAll("text")
        .attr("class", "tick");

    // ---------------------------//
    //           BUBBLES          //
    // ---------------------------//
    bubbleChart.selectAll("circle").remove();
    bubbleChart.selectAll("text:not(.tick)").remove();

    var showTooltip_Circle = function(d) {
        // console.log(d)
        // console.log('!')
        height = d.data.model_count
        // console.log(rScale(d.radius) + height * 1.5 + 50 - d.y + 5000)
        tooltip
            // .offset([rScale(d.radius) + height * 1.5 + 50 - d.y + 5000, 2.3 * rScale(d.radius)]);
            .offset([rScale(d.radius) + height * 1.5 + 50 , 1.5 * rScale(d.radius) + 70]);

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
                    .style("opacity", "0.8")
                    .on("mouseover", showTooltip_Circle)
                    .on("mouseout", tooltip.hide)

    var showTooltip_Label = function(d) {
        tooltip
            .offset([height * 1.5 + 75, 1.5 * rScale(d.radius) + 70]);

        tooltip.show(d);
    }

    function ticked()
    {
        circles
            .attr('cx', d => xS(d.brand))
            .attr('cy', d => d.y)
        
    }
}


const HIS_LEFT = 0, HIS_TOP = 50;
const HIS_TOTAL_WIDTH = 520, HIS_TOTAL_HEIGHT = 450;

const HIS_MARGIN = {
    LEFT: 80,
    RIGHT: 10,
    TOP: 10,
    BOTTOM: 85
};

const HIS_WIDTH = HIS_TOTAL_WIDTH - HIS_MARGIN.LEFT - HIS_MARGIN.RIGHT;
const HIS_HEIGHT = HIS_TOTAL_HEIGHT - HIS_MARGIN.TOP - HIS_MARGIN.BOTTOM;

const histogramChart = d3.select("#hist-chart").append('svg')
    .attr("width", HIS_WIDTH + HIS_MARGIN.LEFT + HIS_MARGIN.RIGHT)
    .attr("height", HIS_HEIGHT + HIS_MARGIN.TOP + HIS_MARGIN.BOTTOM)

const g = histogramChart.append("g")
    .attr("transform", `translate(${HIS_MARGIN.LEFT}, ${HIS_MARGIN.TOP})`);


var update_histo = false;
var rectG, rects;
var histo_xAxis, histo_yAxis;

// param: nodes <-- datas
function drawHistogram(datas) {
    // histogramChart.selectAll("rect").remove();
    // histogramChart.selectAll("text").remove();
    // histogramChart.selectAll(".xAxis").remove();
    // histogramChart.selectAll(".yAxis").remove();

    var type = "";

    // Find datas type
    for (let [key, value] of Object.entries(datas)) {
        for (let [brand, el] of Object.entries(value.data.modelArray)) {
            if (typeof(el[1]) == "number") {
                type = "brand";
            } else if (typeof(el[1]) == "object") {
                type = "cpu";
            }
            break;
        }
        break;
    }

    var x = d3.scaleBand()
        .domain(datas.map((d) => d.cluster))
        .range([0, HIS_WIDTH])
        .paddingInner(0.1)
        .paddingOuter(0.2);

    var xAxis = d3.axisBottom(x)
        .tickValues(datas.map((d) => d.cluster));

    var yScale = d3.scaleLinear()
        .domain([0,d3.extent(datas, d=>d.radius)[1]])
        .range([HIS_HEIGHT, 0]);

    if (!update_histo){
        histo_yAxis = g.append("g")
            .attr("class", "yAxis")
            
        histo_yAxis.call(d3.axisLeft(yScale));

        histo_xAxis = g.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + HIS_HEIGHT + ")")
            
        histo_xAxis.call(xAxis)
            .selectAll("text")
            .attr("x", -35)
            .attr("y", 0)
            .attr("fill", "black")
            .attr("transform", "rotate(-80)");

        g.append("text")
            .attr("x", HIS_WIDTH / 2)
            .attr("y", HIS_HEIGHT + 85)
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .text(type[0].toUpperCase() +  type.slice(1));

        g.append("text")
            .attr("x", - (HIS_HEIGHT / 2))
            .attr("y", -40)
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("Count");

        rectG = g.append("g");
        rects = rectG.selectAll("rect")
            .data(datas)
            .enter()
            .append("rect")
            .attr("x", (d) => x(d.cluster))
            .attr("y", (d) => yScale(d.radius))
            .attr("width", x.bandwidth)
            .attr("height", d => HIS_HEIGHT - yScale(d.radius))
            .attr("fill", (d)=>brandColor(d.cluster))
            .style("opacity", "0.8")
            .style("stroke", "black")
            .style("stroke-width", 1);
    }
    else{
        rectG.selectAll("rect").data(datas).exit().remove();

        var t = d3.transition()
              .duration(1000);

        var new_xAxis = d3.axisBottom(x)
            .tickValues(datas.map((d) => d.cluster));

        var new_yAxis = d3.axisLeft(yScale);

        function adjustText (selection)
        {
            selection.selectAll('text').attr('transform', `translate(${-9},${-1.5}) rotate(-80)`);
        }

        histo_xAxis.transition(t).call(new_xAxis).call(adjustText);
        histo_yAxis.transition(t).call(new_yAxis);

        histo_xAxis.selectAll("text")
                    .attr("x", -35)
                    .attr("y", 0)
                    .attr("fill", "black")
                    .attr("transform", "rotate(-80)");

        rectG.selectAll("rect").data(datas).enter().append("rect").transition(t)
            .attr("x", (d) => x(d.cluster))
            .attr("y", (d) => yScale(d.radius))
            .attr("width", x.bandwidth)
            .attr("height", d => HIS_HEIGHT - yScale(d.radius))
            .attr("fill", (d)=>brandColor(d.cluster))
            .style("opacity", "0.8")
            .style("stroke", "black")
            .style("stroke-width", 1);

        rects = rectG.selectAll("rect");

        rects.data(datas).transition(t)
            .attr("x", (d)=> x(d.cluster))
            .attr("y", (d)=> yScale(d.radius))
            .attr("width", x.bandwidth)
            .attr("height", d => HIS_HEIGHT - yScale(d.radius))
            .attr("fill", (d)=>brandColor(d.cluster))
            .style("opacity", "0.8")
            .style("stroke", "black")
            .style("stroke-width", 1);

    }
    update_histo = true;
}

function detDataBasedCatogory(datas) {
    if (!datas)
    {
        return;
    }

    var type = "";
    var brand = Object.entries(datas)[0][1].brand_data;
    var cpu = Object.entries(datas)[0][1].cpu_data;

    if (brand) {
        type = "brand";
    } else if (cpu) {
        type = "cpu";
    } else {
        type = "numeric";
    }

    return type;
}

var drawChart = function(selected_tab, filterData)
{
    var datas = dataByPriceInterval(filterData, priceSlider1.value, priceSlider2.value);
    if (selected_tab == "brand")
    {
        datas = dataByBrand(datas);
        drawBubbleChart(datas);
    }
    else if (selected_tab == "cpu")
    {
        datas = dataByCPU(datas);
        drawBubbleChart(datas);
    }
    else if (selected_tab == "numeric")
    {
        datas = dataByPrice(datas);
        drawNumericBubbleChart(datas);
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
    var el = document.getElementById("checkbox-wrapper");

    // console.log(el)

    brands.forEach(function(d, i) {
        var elCheckbox = document.createElement('brand-checkbox');
        elCheckbox.className = "checkbox";
        // var str = '<input type="checkbox" value="' + d + '" name="brand_' + d + '" checked>';
        var str = '<input type="checkbox" style="white-space:pre" class="brand-checkbox" value="' + d + '" name="brand_' + d + '" checked />';

        var textBackgroundColor = '<span style="background-color:';
        textBackgroundColor += brandColor(d);
        textBackgroundColor += '; opacity: 0.8;">&emsp; &emsp; </span>';

        // str += '<div>'
        // str += '&#9;';
        str += '&emsp;';
        // str += '</div>'
        str += textBackgroundColor;
        str += '&emsp;';
        str += d;
        // str += '</div>'

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
                tab.classList.remove("active");
            })
            tab.classList.add("active");

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
