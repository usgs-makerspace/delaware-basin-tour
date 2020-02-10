<template>
  <div />
</template>
<script>
import mapboxgl from "mapbox-gl";
import * as d3 from "d3";
import delawareBasinNextGenerationMonitoringLocations
    from "../assets/monitoring_locations/delawareBasinNextGenerationMonitoringLocations";
import generalColorAndStyle from "../assets/mapStyleConstants/generalColorAndStyle";

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
    d3svg: function(SVGContainer) {
      return d3
              .select(SVGContainer)
              .append("svg")
              .attr("id", "monitoringLocationsSVG");
    },
    CreateRings() {
      let map = this.$store.map;
      let self = this;
      //monitoringLocation array entries match up to the index of the color array
      let monitoringLocationFeatureTypes = Object.keys(generalColorAndStyle.generalColorsAndStyles.locationFeaturesColors);
      let colors = Object.values(generalColorAndStyle.generalColorsAndStyles.locationFeaturesColors);
      let pieSegmentColors = d3.scaleOrdinal()
        .domain(monitoringLocationFeatureTypes)
        .range(colors);
        
      //Setup SVG layer that we can manipulate with D3
      const SVGContainer = map.getCanvasContainer();
      const svg = self.d3svg(SVGContainer);

      function projectPoint(data) {
          return map.project(
          new mapboxgl.LngLat(
            data.geometry.coordinates[0],
            data.geometry.coordinates[1]
          )
        );
      }

      const arc = d3
        .arc()
        .innerRadius(generalColorAndStyle.generalColorsAndStyles.d3PieStyles.innerRadius)
        .outerRadius(generalColorAndStyle.generalColorsAndStyles.d3PieStyles.outerRadius);
      const pieSegments = d3.pie()
        .value(function(d) {
            return d.value.segment;
        });

        function createPieData(feature) {
          let pieData = [];
          let allPosibleMonitoringLocationFeatures = Object.keys(generalColorAndStyle.generalColorsAndStyles.locationFeaturesColors);

          // Go through the list of all possible monitoring location features and make a segment of the pie for that
          // If that feature is one of the features at the current monitoring location, mark it as active
          allPosibleMonitoringLocationFeatures.forEach(function(oneOfAllPossibleFeatures) {
            let ringSegment = {
                "featureType": oneOfAllPossibleFeatures,
                "segment": 1,
                "active": feature.properties.locationFeatures.includes(oneOfAllPossibleFeatures) ? true : false
            };
            pieData.push(ringSegment);
          });

          return pieSegments(d3.entries(pieData));
        }

      //Group that has the geojson data for map placement
      const monitoringLocation = svg
        .selectAll("g")
        .data(delawareBasinNextGenerationMonitoringLocations.delawareBasinNextGenerationsMonitoringLocations.features)
        .enter()
        .append("g")
        .classed("D3Ring", true);
      //Groups that hold the path and hold the data created via createPieData
      let pies = monitoringLocation
        .selectAll(".monitoringLocation")
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
        .attr("stroke", generalColorAndStyle.generalColorsAndStyles.d3PieStyles.stroke)
        .attr("stroke-width", 1)
        .attr("fill", function(d){
            if(d.data.value.active === true){
                return(pieSegmentColors(d.data.value.featureType));
            }else{
                return generalColorAndStyle.generalColorsAndStyles.d3PieStyles.default;
            }
        });

      //Updates the placement of the rings based on map movement
      const update = function() {
        monitoringLocation.attr("transform", function(d) {
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
#monitoringLocationsSVG {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>