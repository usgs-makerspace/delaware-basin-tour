<template>
  <div id="story-chapters-container">
    <div
      v-for="chapter in mapStory.chapters"
      :key="chapter.id"
      class="features"
    >
      <section
        :id="chapter.id"
        :class="chapter.class"
      >
        <div
          v-show="!isTourRunning"
          @click="moveToLocation(chapter.flyToCommands, chapter.id)"
          @mouseover="moveToLocation(chapter.flyToCommands, chapter.id)"
        >
          <h3>{{ chapter.title }}</h3>
          <p>
            {{ chapter.content }}
          </p>
        </div>
        <div
          v-show="isTourRunning"
        >
          <h3>{{ chapter.title }}</h3>
          <p>
            {{ chapter.content }}
          </p>
        </div>
        <div class="button-container">
          <button
            v-show="chapter.extendedContent && !isTourRunning"
            @click="runTour(chapter.tourType)"
          >
            take a tour
          </button>
          <button v-show="chapter.extendedContent && isTourRunning">
            Tour is Running
          </button>
        </div>
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
                isTourRunning: false
            };
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
                let self = this; // create an 'alias' for this, so that we can access this inside deeper scopes
                this.isTourRunning = true;
                let map = this.$store.map;
                let interval = 1000;
                let promise = Promise.resolve();
                let locationsInTour = this.getLocationsInTour(tourType);
                let remainingLocations = locationsInTour.length;

                // Fly to the locations on the tour list
                locationsInTour.forEach(function(feature) {
                      promise = promise.then(function () {
                          console.log('number of stops left in tour ' + remainingLocations)
                          remainingLocations = remainingLocations - 1;
                          console.log('flying to ', feature.properties)
                          map.flyTo(feature.properties.flyToCommands);
                          animateCircle(tourType, feature);
                          return new Promise(function (resolve) {
                              if (remainingLocations === 0) {
                                  self.isTourRunning = false;
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
  .features {
    font-family: sans-serif;
    background-color: #fafafa;

    section {
      padding: 25px 50px;
      line-height: 25px;
      border-bottom: 1px solid #ddd;
      opacity: 0.25;
      font-size: 13px;
    }
    section.active {
      opacity: 1;
    }
    section:last-child {
      border-bottom: none;
    }

    .button-container {
      display: flex;

      button {
        flex: 1;
      }
    }
  }
</style>
