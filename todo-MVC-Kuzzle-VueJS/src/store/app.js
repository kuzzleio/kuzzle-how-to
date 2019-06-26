import Vue from 'vue';
const state = {
  waitingForConnection: false,
  online: false,
  isLoading: false,
  notification: { type: null, text: null, id: null }
};

const actions = {
  CONNECT: async ({ commit }, { kuzzle }) => {
    await kuzzle.connect();
  },
  INIT_CONNECTION: async ({ commit, dispatch }, { kuzzle }) => {}
};

const mutations = {
  SET_NOTIFICATION: (state, notification) => {
    Vue.set(state, 'notification', notification);
  },
  SET_LOADING: state => {
    Vue.set(state, 'isLoading', true);
  },
  UNSET_LOADING: state => {
    Vue.set(state, 'isLoading', false);
  },
  SET_ONLINE: state => {
    Vue.set(state, 'online', true);
  },
  SET_OFFLINE: state => {
    Vue.set(state, 'online', false);
  },
  SET_WAITING_FOR_CONNECTION: state => {
    state.waitingForConnection = true;
  },
  UNSET_WAITING_FOR_CONNECTION: state => {
    state.waitingForConnection = false;
  }
};

export default {
  namespaced: true,
  actions,
  state,
  mutations
};
