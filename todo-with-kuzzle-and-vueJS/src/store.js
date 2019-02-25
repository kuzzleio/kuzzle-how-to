import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    connectedToKuzzle: false,
    indexName: 'todolists'
  },
  mutations: {
    setConnection(state, value) {
      state.connectedToKuzzle = value;
    }
  }
});
