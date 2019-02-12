import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';
import Login from './views/Login.vue';
import KuzzleConnect from './views/KuzzleConnect.vue';

import kuzzle from './service/Kuzzle.js';

Vue.use(Router);

const checkAuth = async (to, from, next) => {
  if (!localStorage.getItem('connectedToKuzzle') || localStorage.getItem('connectedToKuzzle') === false) {
    next('/');
    return false;
  }
  const jwt = localStorage.getItem('jwt');
  if (!jwt) {
    next('/login');
    return false;
  }
  try {
    const result = await kuzzle.auth.checkToken(jwt);
    if (!result.valid) {
      next('/login');
      return false;
    }
  } catch (error) {
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
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/home',
      beforeEnter: checkAuth,
      name: 'home',
      component: Home
    }
  ]
});
