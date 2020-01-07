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
          @click="moveToLocation(chapter.flyToCommands, chapter.id)"
          @mouseover="moveToLocation(chapter.flyToCommands, chapter.id)"
      >
        <h3>{{ chapter.title }}</h3>
        <p>
          {{ chapter.content }}
        </p>
      </section>
      <button
          v-show="chapter.extendedContent"
          @click="runTour(chapter.tourType)"
      >
        take a tour
      </button>
    </div>
  </div>
</template>
<script>
    import mapStory from "../assets/mapStory/mapStory";
    import conductanceTour from "../assets/monitoring_locations/conductanceTour";
    import temperatureTour from "../assets/monitoring_locations/temperatureTour";

    import delawareBasinNextGenerationLocations
        from "../assets/monitoring_locations/delawareBasinNextGenerationLocations";

    export default {
        name: "StoryBoard",
        data() {
            return {
                mapStory: mapStory,
                extendedContent: "chapter.extendedContent"
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
            runTour(tourType) {
                let map = this.$store.map;
                let interval = 10000;
                let promise = Promise.resolve();
                let locationsInTour = [];
                // Pick out the monitoring locations for the tour from the list
                delawareBasinNextGenerationLocations.delawareBasinNewGenerationsLocations.features.forEach(function(feature) {
                    if (feature.properties[tourType]) {
                        locationsInTour.push(feature);
                    }
                });

                // Fly to the locations on the tour list
                locationsInTour.forEach(function(feature) {
                    promise = promise.then(function () {
                        console.log('number of stops on tour ' + locationsInTour.length)
                        console.log('flying to ', feature.properties)
                        map.flyTo(feature.properties.flyToCommands)
                        return new Promise(function (resolve) {
                            setTimeout(resolve, interval)
                        });
                    });
                });
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
</style>
