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

document.write("Please look up the console output~")
console.log(dataset);
