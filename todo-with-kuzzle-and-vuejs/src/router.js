import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';
import KuzzleConnect from './views/KuzzleConnect.vue';
import store from './store';

Vue.use(Router);

const checkConnected = async (to, from, next) => {
  const connection = store.state.connectedToKuzzle;

  if (!connection) {
    next('/');
    return false;
  }
  next();
  return true;
};

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL || '/',
  routes: [
    {
      path: '/',
      name: 'kuzzleConnect',
      component: KuzzleConnect
    },
    {
      path: '/home',
      beforeEnter: checkConnected,
      name: 'home',
      component: Home
    }
  ]
});
