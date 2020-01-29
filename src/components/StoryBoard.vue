<template>
  <div id="story-chapters-container">
    <div id="chapters">
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
            @click="moveToLocation(chapter.flyToCommands, chapter.id), toggleLayerVisibility(chapter.layersToHide, chapter.hiddenLayersToShow)"
            @mouseover="moveToLocation(chapter.flyToCommands, chapter.id), toggleLayerVisibility(chapter.layersToHide, chapter.hiddenLayersToShow)"
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
    import delawareBasinNextGenerationLocationsSorted from "../assets/monitoring_locations/delawareBasinNextGenerationLocationsSorted";
    import image from "../images/gages/01581960_gage.jpg";


    export default {
        name: "StoryBoard",
        data() {
            return {
                mapStory: mapStory,
                isTourRunning: false,
                layersToUnhide: [],
                layersToUnshow: []
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
                    'all_locations': delawareBasinNextGenerationLocationsSorted.delawareBasinNewGenerationsLocations.features,
                    'default': []
                };
                return locationsInTour[tourType] || locationsInTour['default'];
            },
            toggleLayerVisibility(layersToHide, layersToShow) {
                let self = this;
                let map = this.$store.map;
                let layersList = self.$store.map.getStyle().layers;
                // Reset all layer visibility to the way it was when the page was first loaded.
                layersList.forEach(function(layer) {
                    if (self.layersToUnhide.includes(layer.id)) {
                        let visibility = map.getLayoutProperty(layer.id, 'visibility');
                        map.setLayoutProperty(layer.id, 'visibility', 'visible');
                    }
                    if (self.layersToUnshow.includes(layer.id)) {
                        let visibility = map.getLayoutProperty(layer.id, 'visibility');
                        map.setLayoutProperty(layer.id, 'visibility', 'none');
                    }
                });

                // Show or hide layer based on what is listed in the 'mapStory.js'
                layersList.forEach(function(layer) {
                    if (layersToShow.includes(layer.id)) {
                        let visibility = map.getLayoutProperty(layer.id, 'visibility');
                        map.setLayoutProperty(layer.id, 'visibility', 'visible');
                    }
                    if (layersToHide.includes(layer.id)) {
                        let visibility = map.getLayoutProperty(layer.id, 'visibility');
                        map.setLayoutProperty(layer.id, 'visibility', 'none');
                    }
                });

                // add the layers we changed to the component data, so that the next time the toggle is run we can reset them
                this.layersToUnhide = layersToHide;
                this.layersToUnshow = layersToShow;
            },
            removeElements(ListOfElements) {
                ListOfElements.forEach(function(element) {
                    element.parentNode.removeChild(element)
                });
            },
            addCustomMarker(layer, feature){
                let map = this.$store.map;
                this.removeElements(document.querySelectorAll('.mapboxgl-popup')); // Remove marker before adding a new one.
                let popup = new mapboxgl.Popup({
                            closeOnClick: false,
                            closeButton: false,
                            offset: [30, -35]
                        }
                );
                let icons = "";
                const gageTypes = feature.properties;
                const keys = Object.keys(gageTypes);
                const filtered = keys.filter((key) => {
                  if(gageTypes[key] === true){
                    return gageTypes[key];
                  }
                });
                //Create Dynamic Icons based on the filtered object keys
                filtered.forEach(function(d){
                  //Need this for webpack to find the icons
                  let iconURL = require('../images/icons/PNG/COLORED/' + d + '.png');
                  //icons stores the multiple img tags to be fed to the popup
                  icons += "<img src='" + iconURL + "'/> ";
                });
                
                layer !== 'all_locations' ? popup.setText(feature.properties.site_id) : popup.setHTML('<div>' + feature.properties.site_id + '</div><div id="iconContainer">' + icons +'</div>');

                new mapboxgl.Marker({
                    "color": map.getPaintProperty(layer, 'circle-color') // Make the custom marker color the same as the 'dot/circle' color from the layer
                })
                        .setLngLat(feature.geometry.coordinates)
                        .setPopup(popup)
                        .addTo(map)
                        .togglePopup();
            },
            runTour(tourType) {
                let self = this; // create an 'alias' for 'this', so that we can access 'this' inside deeper scopes
                self.isTourRunning = true;
                let map = this.$store.map;
                let interval = 1000;
                let promise = Promise.resolve();
                let locationsInTour = self.getLocationsInTour(tourType);
                let remainingLocations = locationsInTour.length;
                // Fly to the locations on the tour list
                locationsInTour.forEach(function(feature) {
                      promise = promise.then(function () {
                          remainingLocations = remainingLocations - 1;
                          map.flyTo(feature.properties.flyToCommands);
                          self.addCustomMarker(tourType, feature);
                          return new Promise(function (resolve) {
                              if (remainingLocations === 0) {
                                  self.isTourRunning = false;
                                  setTimeout(function () { // Wait a little after the tour, then remove the any markers and popups.
                                      self.removeElements(document.querySelectorAll(".mapboxgl-marker"));
                                      self.removeElements(document.querySelectorAll(".mapboxgl-popup"));
                                  }, 3000);
                              }
                              setTimeout(resolve, interval);
                          });
                      });
                });
            }
        }
    };
</script>
<style scoped lang="scss">
  #story-chapters-container{
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  #chapters{
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
    /* for Firefox */
    min-height: 0;
  }

  .features {
    font-family: sans-serif;
    flex-grow: 1;

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
<style lang="scss">
  #iconContainer{
    display: flex;
    justify-content: center;

    img{
      height: 40px;
      width: 40px;
    }
  }

  .mapboxgl-popup-anchor-bottom{
    .mapboxgl-popup-tip{
      width: 25px;
      height: 20px;
      border: none;
      margin-right: 35px;
      background: linear-gradient(to right bottom, white 50%, transparent 50%)
    }
  }

  .mapboxgl-popup{

    .mapboxgl-popup-content {
      text-align: center;
      border-radius: 10px;
      img {
        margin-top: 5px;
        width: 150px;
        height: auto;
      }
    }

  }
</style>
