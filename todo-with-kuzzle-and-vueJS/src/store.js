import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    connectedToKuzzle: false
  },
  mutations: {
    setConnection(state, value) {
      state.connectedToKuzzle = value;
    }
  }
});
