<template>
  <div id="app">
    <router-view v-if="this.isConnected === true"/>
    <div v-else>

    </div>
  </div>
</template>

<script>
import kuzzle from '../service/kuzzle';

export default {
  data() {
    return {
      isConnected: false
    };
  },
  methods: {
    async connect() {
      try {
        await kuzzle.connect();
        this.isConnected = true;
      } catch (error) {
        console.error(error.message);
      }
    }
  },
  mounted() {
    this.connect();
  }
};
</script>

<style scoped>
  body {
    background-color: #F0F0F0;
  }
  h1 {
    padding: 0;
    margin-top: 0;
  }
  #app {
    margin: auto;
    align-content: center;

  }
</style>
