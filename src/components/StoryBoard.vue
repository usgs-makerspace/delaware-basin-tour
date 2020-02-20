<template>
  <div id="story-chapters-container">
    <D3Rings />
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
            @click="moveToLocation(chapter.flyToCommands, chapter.id), toggleLayerVisibility(chapter.id, chapter.layersToHide, chapter.hiddenLayersToShow), addMonitoringLocationRings(chapter.D3Rings), chapter.isText ? toggleTextOverlay(state='on', chapter.html) : toggleTextOverlay(state='off', null)"
            @mouseover="moveToLocation(chapter.flyToCommands, chapter.id), toggleLayerVisibility(chapter.id, chapter.layersToHide, chapter.hiddenLayersToShow), addMonitoringLocationRings(chapter.D3Rings), chapter.isText ? toggleTextOverlay(state='on', chapter.html) : toggleTextOverlay(state='off', null)"
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
          <h4
            v-show="chapter.tourType !== 'none' && isTourRunning"
            class="tour-running"
          >
            tour is running<br>{{ locationsRemainingInTour }} locations remaining
          </h4>
          <h4
            v-show="chapter.tourType !== 'none' && !isTourRunning && indexOfPausedTour > 0"
            class="tour-paused"
          >
            tour is paused<br>{{ locationsRemainingInTour }} locations remaining
          </h4>
          <div class="button-container">
            <button
              v-show="chapter.tourType !== 'none' && !isTourRunning && indexOfPausedTour === 0"
              @click="runTour(chapter.tourType)"
            >
              take a tour
            </button>
            <button
              v-show="chapter.tourType !== 'none' && !isTourRunning && indexOfPausedTour > 0"
              @click="runTour(chapter.tourType)"
            >
              resume tour
            </button>

            <button
              v-show="chapter.tourType !== 'none' && isTourRunning"
              @click="pauseTour"
            >
              pause the tour
            </button>
            <button
              v-show="chapter.DarkButton && !isDarkStyle"
              @click="activateDarkStyle"
            >
              dark style
            </button>
            <button
              v-show="chapter.DarkButton && isDarkStyle"
              @click="activateDarkStyle"
            >
              regular style
            </button>
            <button
              v-show="chapter.DarkButton"
              @click="zoomToggle"
            >
              zoom a bit
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
    import delawareBasinNextGenerationMonitoringLocations
        from "../assets/monitoring_locations/delawareBasinNextGenerationMonitoringLocations";
    import D3Rings from './D3Rings';
    import generalColorAndStyle from "../assets/mapStyleConstants/generalColorAndStyle";
    import mapStylesDark from "../assets/mapStyles/mapStylesDark";
    import mapStyles from "../assets/mapStyles/mapStyles";

    export default {
        name: "StoryBoard",
        components:{
          D3Rings
        },
        data() {
            return {
                mapStory: mapStory,
                currentlyActiveChapterId: null,
                isTourRunning: false,
                layersToUnhide: [],
                layersToUnshow: [],
                isTourPauseActive: false,
                indexOfPausedTour: 0,
                locationsRemainingInTour: null,
                isZoomedIn: false,
                isDarkStyle: false
            };
        },
        methods: {
            zoomToggle() {
                const self = this;
                const map = this.$store.map;
                let zoomLevel = null;
                self.isZoomedIn === false ? zoomLevel = 12 : zoomLevel = 4; // Set the minimum and maximum zoom levels for the fly to
                map.flyTo(
                        {
                            "duration": 9000,
                            "bearing": 0,
                            "center": [-75.600766, 40.4467],
                            "zoom": zoomLevel,
                            "pitch": 0,
                            "speed": 0.2,
                            "essential": true
                        }
                );
                self.isZoomedIn = !self.isZoomedIn;
            },
            activateDarkStyle() {
                const self = this;
                const map = this.$store.map;
                self.isDarkStyle === false ? map.setStyle(mapStylesDark.style) : map.setStyle(mapStyles.style); // If the map is not dark, make it dark and vice versa
                self.isDarkStyle = !self.isDarkStyle;
                map.on('style.load', function () {
                    self.$emit('addDynamicLayers');
                });
            },
            moveToLocation(flyToCommands, elementId) {
                let allActiveSectionElements = document.querySelectorAll("section.active");
                [...allActiveSectionElements].forEach((selection) => {
                    selection.setAttribute('class', '');
                });
                document.getElementById(elementId).setAttribute('class', 'active');
                this.$store.map.flyTo(flyToCommands);
            },
            getLocationsForSpecificTours(tourType) {
                let locationsInTour = [];
                delawareBasinNextGenerationMonitoringLocations.delawareBasinNextGenerationsMonitoringLocations.features.forEach(function(feature) {
                    if (feature.properties.locationFeatures.includes(tourType)) {
                        locationsInTour.push(feature);
                    }
                });

                return locationsInTour;
            },
            getLocationsInTour(tourType) {
                const locationsInTour = {
                    'all_locations': delawareBasinNextGenerationMonitoringLocations.delawareBasinNextGenerationsMonitoringLocations.features,
                    'camera': this.getLocationsForSpecificTours('camera'),
                    'specific_conductance': this.getLocationsForSpecificTours('specific_conductance'),
                    'enhanced_gage': this.getLocationsForSpecificTours('enhanced_gage'),
                    'new_gage': this.getLocationsForSpecificTours('new_gage'),
                    'temperature': this.getLocationsForSpecificTours('temperature'),
                    'default': []
                };

                return locationsInTour[tourType] || locationsInTour['default'];
            },
            toggleLayerVisibility(chapterId, layersToHide, layersToShow) {
                let self = this;
                let map = this.$store.map;
                let layersList = self.$store.map.getStyle().layers;

                // If the user moves to a new chapter, the paused nextGenerationMonitoringLocations resets in preparation for a new nextGenerationMonitoringLocations.
                if (chapterId !== self.currentlyActiveChapterId) {
                    self.indexOfPausedTour = 0;
                    self.removeElements(document.querySelectorAll('.mapboxgl-popup'));
                    self.removeElements(document.querySelectorAll(".mapboxgl-marker"));
                }

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
                self.layersToUnhide = layersToHide;
                self.layersToUnshow = layersToShow;
                self.currentlyActiveChapterId = chapterId;
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
                feature.properties.locationFeatures.forEach(function(iconName){
                  try {
                      let iconURL = require('../images/icons/PNG/COLORED/' + iconName + '.png');
                      // icons stores the multiple img tags to be fed to the popup
                      icons += "<img alt='features icons' src='" + iconURL + "'/> ";
                  } catch {
                      console.log('Warning: there has been a problem adding the popup icons. Perhaps you have a property ' +
                              'in the monitoring location JSON that does not have a matching icon available.');
                  }
                });

                layer !== 'all_locations' ? popup.setText(feature.properties.site_id) : popup.setHTML('<div>' + feature.properties.site_id + '</div><div id="iconContainer">' + icons +'</div>');

                new mapboxgl.Marker({
                    "color": layer === 'all_locations'? // Make the custom marker color the same as the 'dot/circle' color from the master style sheet
                            generalColorAndStyle.generalColorsAndStyles.monitoringLocationAll.mapDotColor :
                            generalColorAndStyle.generalColorsAndStyles.locationFeaturesColors[layer]
                })
                        .setLngLat(feature.geometry.coordinates)
                        .setPopup(popup)
                        .addTo(map)
                        .togglePopup();
            },
            runTour(tourType) {
                let self = this; // create an 'alias' for 'this', so that we can access 'this' inside deeper scopes
                self.isTourRunning = true;
                self.isTourPauseActive = false;
                let map = this.$store.map;
                let promise = Promise.resolve();
                let locationsInTour = self.getLocationsInTour(tourType);
                let remainingLocations = null;

                // If the tour is resumed from a paused state we need to account for the number of stations that are left out
                remainingLocations = locationsInTour.length - self.indexOfPausedTour;

                // Fly to the locations on the tour list
                locationsInTour.forEach(function(feature, index) {
                    if (index >= self.indexOfPausedTour) {
                        promise = promise.then(function() {
                            remainingLocations = remainingLocations - 1;
                            self.locationsRemainingInTour = remainingLocations;
                            map.flyTo(feature.properties.flyToCommands);
                            self.addCustomMarker(tourType, feature);
                            return new Promise(function (resolve, reject) {
                                if (self.isTourPauseActive) { // If user has pressed the pause button, reject the promise and break the promise chain
                                    self.indexOfPausedTour = index; // Save the index so we can resume the tour at the same place
                                    self.locationsRemainingInTour = remainingLocations;
                                    reject('user paused nextGenerationMonitoringLocations');
                                }

                                if (remainingLocations === 0) {
                                    self.isTourRunning = false;
                                    self.indexOfPausedTour = 0;
                                    setTimeout(function () { // Wait a little after the tour, then remove the any markers and popups.
                                        self.removeElements(document.querySelectorAll(".mapboxgl-marker"));
                                        self.removeElements(document.querySelectorAll(".mapboxgl-popup"));
                                    }, 3000);
                                }
                                map.on('moveend', function (e) {
                                    resolve('end of flyTo')
                                });
                            });
                        });

                        promise.catch(function() {   // When the pause button is pressed, reset the tour so it can be resumed or restarted.
                            self.isTourPauseActive = false;
                            self.isTourRunning = false;
                        });
                    }
                });
            },
            pauseTour() {
                if(this.isTourPauseActive === false) {
                    this.isTourPauseActive = true;
                }
            },
            toggleTextOverlay(state, html) {
                // Get map canvas and container elements,  assign ID for overlay div
                let mapCanvas = this.$store.map.getCanvas();
                let mapCanvasContainer = this.$store.map.getCanvasContainer();
                let overlayID = 'mapOverlay';

                // See if we have a text overlay div; create a hidden one if we don't
                let mapOverlay = document.getElementById(overlayID);
                if (typeof(mapOverlay) == 'undefined' || mapOverlay == null) {
                    mapOverlay = document.createElement('div');
                    mapOverlay.id = overlayID;
                    mapOverlay.style.display = 'none';
                    mapCanvasContainer.appendChild(mapOverlay);
                }

                // Load/unload text overlay content, toggle map opacity, show/hide text overlay div
                if (state === 'on') {
                    mapOverlay.innerHTML = html;
                    mapCanvas.style.opacity = "0.2";
                    mapOverlay.style.display = 'block'
                } else {
                    mapOverlay.style.display = 'none';
                    mapCanvas.style.opacity="1";
                    mapOverlay.innerHTML = '';
                }
            },
            addMonitoringLocationRings(D3Rings){
              if(D3Rings === true){
                this.$root.$emit('CreateRings');
              }else{
                this.$root.$emit('RemoveRings');
              }
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

    .tour-running {
      text-align: center;
    }
    .tour-paused {
      text-align: center;
      color: darkgrey;
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
      margin-right: 5px;
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
  /* Needs to be unscoped or it won't apply to the dynamically-generated div */
  #mapOverlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 90%;
    margin: 5em 5%;
    padding: 2em;
    border: 1px solid #444;
    box-shadow: 8px 8px 5px rgba(110, 110, 110, 0.6);
    overflow: scroll;
    z-index: 5;
    color: #000;
    background-color: rgba(255, 255, 255, 0.8);
  }
</style>
