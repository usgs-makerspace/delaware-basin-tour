<template>
  <div id="viz_container">
    <LoadingScreen
      v-if="!isInternetExplorer"
      :is-loading="isLoading"
    />

    <div class="header-container">
      <div class="usa-prose">
        <h1 class="title-text">
          {{ title }}{{ titleSuffix }}{{ developmentTier }}
        </h1>
      </div>
    </div>
    <InternetExplorerPage v-if="isInternetExplorer" />
    <div id="viz_sections">
      <div
        v-if="!isInternetExplorer"
        id="mapContainer"
      >
        <div id="map-section">
          <MglMap
            id="mapgl"
            :container="container"
            :map-style="mapStyle"
            :zoom="zoom"
            :min-zoom="minZoom"
            :max-zoom="maxZoom"
            :center="center"
            :pitch="pitch"
            :bearing="bearing"
            :pitch-with-rotate="false"
            :drag-rotate="false"
            :touch-zoom-rotate="false"
            :max-bounds="maxBounds"
            @load="onMapLoaded"
          >
            <MglAttributionControl
              position="bottom-right"
              :compact="false"
              custom-attribution="© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />

            <MglNavigationControl
              position="top-right"
              :show-compass="false"
            />
            <QuestionControl />
            <MglScaleControl
              position="bottom-right"
              unit="imperial"
            />
            <MglFullscreenControl position="bottom-right" />
            <MglGeolocateControl position="bottom-right" />
          </MglMap>
        </div>
      </div>
      <div id="story-section">
        <StoryBoard />
      </div>
    </div>
    
    <!--The next div contains information to show the current zoom level of the map. This will only show on the
          development version of the application. To find the code controlling this, search for 'zoom level display' -->
    <div id="zoom-level-div" />
  </div>
</template>
<script>
    import LoadingScreen from './LoadingScreen';
    import InternetExplorerPage from "./InternetExplorerPage";
    import QuestionControl from "./QuestionControl";
    import StoryBoard from "./StoryBoard";
    import D3Rings from './D3Rings';

    import {
        MglMap,
        MglNavigationControl,
        MglGeolocateControl,
        MglFullscreenControl,
        MglScaleControl,
        MglAttributionControl
    } from "vue-mapbox";
    import mapStyles from "../assets/mapStyles/mapStyles";
    import delawareBasinCameraLocations from "../assets/monitoring_locations/delawareBasinCameraLocations";
    import delawareBasinConductanceLocations from "../assets/monitoring_locations/delawareBasinConductanceLocations";
    import delawareBasinEnhancedLocations from "../assets/monitoring_locations/delawareBasinEnhancedLocations";
    import delawareBasinNewLocations from "../assets/monitoring_locations/delawareBasinNewLocations";
    import delawareBasinTemperatureLocations from "../assets/monitoring_locations/delawareBasinTemperatureLocations";
    import delawareBasinNextGenerationMonitoringLocations
        from "../assets/monitoring_locations/delawareBasinNextGenerationMonitoringLocations";

    export default {
        name: "MapBox",
        components: {
            LoadingScreen,
            InternetExplorerPage,
            MglMap,
            MglNavigationControl,
            MglGeolocateControl,
            MglFullscreenControl,
            MglScaleControl,
            MglAttributionControl,
            QuestionControl,
            StoryBoard
        },
        props: {
            isInternetExplorer: {
                type: Boolean,
                required: true,
                default: false
            }
        },
        data() {
            return {
                title: process.env.VUE_APP_TITLE,
                titleSuffix: process.env.VUE_APP_TITLE_SUFFIX,
                developmentTier: process.env.VUE_APP_TIER,
                mapStyle: mapStyles.style,
                container: "map",
                zoom: 2,
                minZoom: 2,
                maxZoom: 15,
                center: [-95.7129, 37.0902],
                pitch: 0, // tips the map from 0 to 60 degrees
                bearing: 0, // starting rotation of the map from 0 to 360
                maxBounds: [[-168.534393,-4.371744], [-19.832382,71.687625]], // The coordinates needed to make a bounding box for the continental United States.
                isLoading: true
            };
        },
        created() {
           this.map = null; // This will allow access to the map object in later methods
        },
        methods: {
            addZoomLevelIndicator() {
                document.getElementById("zoom-level-div").innerHTML = 'Current Zoom Level (listed for development purposes): ' + this.map.getZoom() ;
            },
            onMapLoaded(event) {
                this.map = event.map; // This gives us access to the map as an object but only after the map has loaded.
                this.map.resize(); // This cures the mysterious whitespace that appears above the footer is was caused by the 'official' banner at the top.
                this.map.touchZoomRotate.enable({ around: 'center' }); // Add pinch to zoom for touch devices.
                this.map.touchZoomRotate.disableRotation(); // Disable the rotation functionality, but keep pinch to zoom.
                this.map.fitBounds([[-125.3321, 23.8991], [-65.7421, 49.4325]]); // Once map is loaded, zoom in a bit more so that the map neatly fills the screen.
                this.$store.map = event.map; // Add the map to the Vuex store so that we can use it in other components.
                // Pause the code here to make sure the fitbounds has time to finish before fade away of loading screen.
                setTimeout(() => { this.isLoading = false; }, 200);
                // Next line adds the current zoom level display. The zoom level should only show in 'development' versions of the application.
                process.env.VUE_APP_ADD_ZOOM_LEVEL_DISPLAY === 'true' ? this.map.on("zoomend", this.addZoomLevelIndicator) : null;

                this.map.addSource('delawareBasinCameraLocations', {
                    type: 'geojson',
                    data: delawareBasinCameraLocations.delawareBasinCameraLocations
                });

                this.map.addSource('delawareBasinConductanceLocations', {
                    type: 'geojson',
                    data: delawareBasinConductanceLocations.delawareBasinConductanceLocations
                });

                this.map.addSource('delawareBasinEnhancedLocations', {
                    type: 'geojson',
                    data: delawareBasinEnhancedLocations.delawareBasinEnhancedLocations
                });

                this.map.addSource('delawareBasinTemperatureLocations', {
                    type: 'geojson',
                    data: delawareBasinTemperatureLocations.delawareBasinTemperatureLocations
                });

                this.map.addSource('delawareBasinNewLocations', {
                    type: 'geojson',
                    data: delawareBasinNewLocations.delawareBasinNewLocations
                });

                this.map.addSource('delawareBasinAllNewEnhancedLocations', {
                    type: 'geojson',
                    data: delawareBasinNextGenerationMonitoringLocations.delawareBasinNextGenerationsMonitoringLocations
                });



                this.map.addLayer({
                    "id": "cameras",
                    "source": "delawareBasinCameraLocations",
                    "type": "circle",
                    "paint": {
                        "circle-radius": 11,
                        "circle-color": "green"
                    }
                });

                this.map.addLayer({
                    "id": "specific_conductance",
                    "source": "delawareBasinConductanceLocations",
                    "type": "circle",
                    "paint": {
                        "circle-radius": 10,
                        "circle-color": "red"
                    }
                });

                this.map.addLayer({
                    "id": "enhanced_gage",
                    "source": "delawareBasinEnhancedLocations",
                    "type": "circle",
                    "paint": {
                        "circle-radius": 8,
                        "circle-color": "blue"
                    }
                });

                this.map.addLayer({
                    "id": "temperature",
                    "source": "delawareBasinTemperatureLocations",
                    "type": "circle",
                    "paint": {
                        "circle-radius": 5,
                        "circle-color": "yellow"
                    }
                });

                this.map.addLayer({
                    "id": "new_gage",
                    "source": "delawareBasinNewLocations",
                    "type": "circle",
                    "paint": {
                        "circle-radius": 3,
                        "circle-color": "black"
                    }
                });

                this.map.addLayer({
                    "id": "all_locations",
                    "source": "delawareBasinAllNewEnhancedLocations",
                    "type": "circle",
                    "paint": {
                        "circle-radius": 2,
                        "circle-color": "black"
                    }
                })
            }
        }
    };
</script>

<style scoped lang="scss">
  @import "~mapbox-gl/dist/mapbox-gl.css";
  $color: #fff;
  $blue: #4574a3;
  $border: 1px solid #fff;
  $borderGray: 1px solid rgb(100, 100, 100);
  .header-container {
    background-color: #fff;
  }
  /* Add a background color to the layer toggle bar */
  #mapbox_component-layer-toggle {
    background-color: $blue;
    overflow: hidden;
    display: flex;
  }
  #topNavText {
    border-right: $border;
    width: 110px;
    a {
      width: 100%;
      font-size: 0.9em;
      color: $color;
      background: #00264c;
      vertical-align: center;
    }
  }
  #iconToggleContainer {
    display: flex;
    width: 120px;
    border-left: $border;
    a {
      flex: 1;
      background: #00264c;
      margin: 0;
      color: $color;
    }
    a.active{
      background: #00bf26
    }
    .icon {
      &:nth-child(2){
        border-left: $border;
      }
    }
  }
  #layers,
  #streams{
    display: none;
  }
  .usa-prose {
    border-bottom: $borderGray;
    display: flex;
    h1 {
      font-size: 1rem;
      margin-left: 10px;
      flex: 1;
    }
    a{
      margin: 0;
      display: block;
    }
  }
  #aboutButton{
    background: none;
    color: #003366;
    width: 100px;
    height: 100%;
    margin: 0;
    outline: none;
    border-style: none;
    &:hover{
      background: #00bf26;
      color: #fff;
    }
  }
  #viz_container {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  #viz_sections{
    flex: 1;
    display: flex;
    /*Stops Story Section from being full heigh tot show all of its content*/
    max-height: 79vh;
  }
  #mapContainer {
    position: relative;
    min-height: 200px;
    display: flex;
    flex: 3;
    #map-section {
      flex: 1;
    }
  }
  #story-section {
      display: flex;
      flex: 1;
      min-height: 100px;
      overflow: hidden;
      background: #fafafa;
    }
</style>


