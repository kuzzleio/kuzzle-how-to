import Vue from 'vue';
import App from './App.vue';
import router from './router';
import VueIziToast from 'vue-izitoast';
import Vuetify from 'vuetify';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import 'vuetify/dist/vuetify.min.css';
import 'izitoast/dist/css/iziToast.css';

Vue.use(VueIziToast);
Vue.use(Vuetify, {
  iconfont: 'md'
});
Vue.config.prodctionTip = false;

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');
