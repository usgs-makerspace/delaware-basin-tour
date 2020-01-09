<template>
  <div id="story-chapters-container">
    <div
      v-for="chapter in mapStory.chapters"
      id="features"
      :key="chapter.id"
    >
      <section
        :id="chapter.id"
        :class="chapter.class"
      >
        <h3>{{ chapter.title }}</h3>
        <p>
          {{ chapter.content }}
        </p>
        <button
        v-show="chapter.extendedContent && show"
        @click="runTour(chapter.tourType)"
      >
        take a tour
      </button>
      <button v-show="chapter.extendedContent && !show">
        Tour is Running
      </button>
      </section>
      
    </div>
  </div>
</template>
<script>
    import mapStory from "../assets/mapStory/mapStory";
    import mapboxgl from "mapbox-gl";
    import delawareBasinCameraLocations from "../assets/monitoring_locations/delawareBasinCameraLocations";
    import delawareBasinConductanceLocations from "../assets/monitoring_locations/delawareBasinConductanceLocations";
    import delawareBasinEnhancedLocations from "../assets/monitoring_locations/delawareBasinEnhancedLocations";
    import delawareBasinNewLocations from "../assets/monitoring_locations/delawareBasinNewLocations";
    import delawareBasinTemperatureLocations from "../assets/monitoring_locations/delawareBasinTemperatureLocations";

    export default {
        name: "StoryBoard",
        data() {
            return {
                mapStory: mapStory,
                show: true
            };
        },
        computed: {
            isTourRunning() {
                return this.$store.getters.getDataForIsTourRunning();
            }
        },
        methods: {
            moveToLocation(flyToCommands, elementId) {
                let allActiveSectionElements = document.querySelectorAll("section.active");
                [...allActiveSectionElements].forEach((selection) => {
                    selection.setAttribute('class', '');
                });
                document.getElementById(elementId).setAttribute('class', 'active');
                this.$store.map.flyTo(flyToCommands);
            },
            getLocationsInTour(tourType) {
                const locationsInTour = {
                    'cameras': delawareBasinCameraLocations.delawareBasinCameraLocations.features,
                    'specific_conductance': delawareBasinConductanceLocations.delawareBasinConductanceLocations.features,
                    'enhanced_gage': delawareBasinEnhancedLocations.delawareBasinEnhancedLocations.features,
                    'new_gage': delawareBasinNewLocations.delawareBasinNewLocations.features,
                    'temperature': delawareBasinTemperatureLocations.delawareBasinTemperatureLocations.features,
                    'default': []
                };
                return locationsInTour[tourType] || locationsInTour['default'];
            },
            runTour(tourType) {
                let map = this.$store.map;

                let interval = 1000;
                let promise = Promise.resolve();
                let locationsInTour = this.getLocationsInTour(tourType);
                let remainingLocations = locationsInTour.length;

                // Fly to the locations on the tour list
                locationsInTour.forEach(function(feature) {
                    console.log('first remaining ', remainingLocations)
                      promise = promise.then(function () {
                          console.log('number of stops left in tour ' + remainingLocations)
                          remainingLocations = remainingLocations - 1;
                          console.log('flying to ', feature.properties)
                          map.flyTo(feature.properties.flyToCommands);
                          animateCircle(tourType, feature);
                          return new Promise(function (resolve) {
                              if (remainingLocations === 0) {
                                  console.log('yea');

                              }
                              setTimeout(resolve, interval);
                          });
                      });
                });
                function animateCircle(layer, feature){
                  const markerColor = map.getPaintProperty(layer, 'circle-color');
                  const element = document.createElement('div')
                  element.className = 'marker';

                  new mapboxgl.Marker({
                    "color": markerColor
                  })
                    .setLngLat(feature.geometry.coordinates)
                    .addTo(map);
                }
            },
        }
    };
</script>
<style scoped lang="scss">
  #features {
    font-family: sans-serif;
    background-color: #fafafa;
  }
  section {
    padding: 25px 50px;
    line-height: 25px;
    opacity: 0.30;
    font-size: 13px;
    cursor: pointer;

    button{
      outline: none;
      border-radius: 5px;
      cursor: pointer;
      &:hover{
        background: #003366;
        color: #fff;
      }
    }
  }
  section.active {
    opacity: 1;
     border-bottom: 1px solid #ddd;
      border-top: 1px solid #ddd;
  }
</style>
