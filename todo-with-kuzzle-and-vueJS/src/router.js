import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';
import KuzzleConnect from './views/KuzzleConnect.vue';

Vue.use(Router);

const checkConnected = async (to, from, next) => {
  if (!localStorage.getItem('connected2kuzzle') || localStorage.getItem('connected2kuzzle') === 'false') {
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
