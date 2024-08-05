const svg = d3.select("#map");
const width = +svg.attr("width");
const height = +svg.attr("height");

const projection = d3.geoNaturalEarth1()
  .scale(150)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

d3.json("https://d3js.org/world-110m.v1.json").then(worldData => {
  svg.append("path")
    .datum(topojson.feature(worldData, worldData.objects.countries))
    .attr("d", path)
    .attr("class", "land");
});
