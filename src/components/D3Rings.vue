<template>
  <div />
</template>
<script>
import mapboxgl from "mapbox-gl";
import * as d3 from "d3";
import tour from "../assets/monitoring_locations/delawareBasinNextGenerationLocationsSorted";
export default {
  name: "D3Rings",
  mounted() {
    this.$root.$on("CreateRings", () => {
      this.CreateRings();
    });
    this.$root.$on("RemoveRings", () => {
      this.RemoveRings();
    });
  },
  methods: {
    CreateRings() {
      let map = this.$store.map;
      let $this = this;
      let radius = 15;
      //Gage array entries match up to the index of the color array
      let gageArray = ["enhanced_gage", "new_gage", "specific_conductance", "temperature", "camera"];
      let colors = ["#00F4CE", "#2B9BFD", "#FEBD03", "#FE324D", "#FF562F"];
      let pieSegmentColors = d3.scaleOrdinal()
        .domain(gageArray)
        .range(colors);
        
      //Setup SVG layer that we can manipulate with D3
      const SVGContainer = map.getCanvasContainer();
      const svg = d3
        .select(SVGContainer)
        .append("svg")
        .attr("id", "gagesSVG");

      function projectPoint(data, coordinate) {
        let point = map.project(
          new mapboxgl.LngLat(
            data.geometry.coordinates[0],
            data.geometry.coordinates[1]
          )
        );
        return point;
      }

      const arc = d3
        .arc()
        .innerRadius(10)
        .outerRadius(radius);
      const pieSegments = d3.pie()
        .value(function(d) {
            return d.value.segment;
        });

      let gages = tour.delawareBasinNewGenerationsLocations.features;

      function createPieData(feature){
            let pieData = []
          let properties = feature.properties;
          let keys = Object.keys(properties);
          let filtered = keys.filter(function(key){
              if(gageArray.includes(key)){
                  let obj = {};
                  obj["gageType"] = key;
                  obj["segment"] = 1;
                  obj["active"] = properties[key];
                  pieData.push(obj);
              }
          })
          let dataReady = pieSegments(d3.entries(pieData));
          return dataReady;
      };
    //Group that has the geojson data for map placement
      const gage = svg
        .selectAll("g")
        .data(gages)
        .enter()
        .append("g")
        .classed("D3Ring", true);
    //Groups that hold the path and hold the data created via createPieData
      let pies = gage
        .selectAll(".gage")
        .data(function(d) {
          return createPieData(d);
        })
        .enter()
        .append("g")
        .classed("arc", true);

      pies
        .append("path")
        .attr("d", arc)
        .attr("class", "pieSegment")
        .attr("stroke", "#50575D")
        .attr("stroke-width", 1)
        .attr("fill", function(d){
            if(d.data.value.active === true){
                return(pieSegmentColors(d.data.value.gageType));
            }else{
                return "#CFD1D0";
            }
            
        });
    //Updates the placement of the rings based on map movement
      const update = function() {
        gage.attr("transform", function(d) {
          return "translate(" + [projectPoint(d).x, projectPoint(d).y] + ")";
        });
      };

      // Every time the map changes, update the dots
      map.on("viewreset", update);
      map.on("move", update);
      map.on("moveend", update);

      update();
    },
    RemoveRings(){
        d3.selectAll(".D3Ring").remove();
    }
  }
};
</script>
<style lang="scss">
#gagesSVG {
  position: absolute;
  width: 100%;
  height: 100%;
}

.enhanced_gage{ fill: #278DD8} 
.new_gage{ fill: #00CDA6}      
.specific_conductance{ fill: #D99A03}
.temperature{fill: #D82B47}
.camera{ fill: #D878B5}
</style>