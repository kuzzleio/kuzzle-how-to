<template>
  <v-app light id="app">
    <v-container grid-list-sm text-xs-center>
      <div v-if="online">
        <router-view />
      </div>
      <div class="center" id="circle" v-else>
        <v-progress-circular
          indeterminate
          color="blue"
          :size="100"
          :width="10"
        ></v-progress-circular>
      </div>
    </v-container>
  </v-app>
</template>

<script>
import kuzzle from './service/Kuzzle.js';

export default {
  computed: {
    online() {
      return this.$store.state.app.online;
    }
  },
  mounted() {
    kuzzle.addListener('disconnected', () => {
      this.$store.commit('app/SET_OFFLINE');
      this.$store.dispatch('app/CONNECT', {
        kuzzle
      });
    });
    kuzzle.addListener('connected', () => {
      this.$store.commit('app/SET_ONLINE');
    });
    kuzzle.addListener('reconnected', () => {
      this.$store.commit('app/SET_ONLINE');
    });
    this.$store.dispatch('app/CONNECT', {
      kuzzle
    });
  }
};
</script>

<style scoped>
body {
  background-color: #f0f0f0;
}
#app {
  margin: auto;
  align-content: center;
}
#circle {
  width: 500px;
  border: 1px solid #cccccc;
  background-color: #ffffff;
  margin: auto;
  margin-top: 200px;
  padding: 20px;
}
</style>
