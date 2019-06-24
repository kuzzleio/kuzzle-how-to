import Vue from 'vue';
import Vuex from 'vuex';

import app from './store/app';
import lists from './store/lists';
import tasks from './store/tasks';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    app,
    lists,
    tasks
  }
});
