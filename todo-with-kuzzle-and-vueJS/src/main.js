import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

/* eslint-disable */


Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')


const {
    Kuzzle,
    WebSocket
} = require('kuzzle-sdk');

const kuzzle = new Kuzzle(
    new WebSocket('localhost')
);

kuzzle.on('networkError', error => {
    console.error('Network Error: ', error);
});

export default kuzzle;

const run = async () => {
    // Connects to the Kuzzle server
    try {
      await kuzzle.connect();
    } catch (error) {
      console.error(error.message);
    }
}

run();



