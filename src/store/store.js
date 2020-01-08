import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export const store = new Vuex.Store({
    state: {
        isTourRunning: false
    },
    mutations: {
        mutateDataForIsTourRunning(state, payload) {
            state.isTourRunning = payload;
        }
    },
    actions: {
        changeDataForIsTourRunning(state, payload) {
            state.commit('mutateDataForIsTourRunning', payload)
        }
    },
    getters: {
        getDataForIsTourRunning(state) {
            return state.isTourRunning;
        }
    }
});