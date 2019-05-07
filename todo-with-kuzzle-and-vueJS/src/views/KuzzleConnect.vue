<template>
  <v-app light id="KuzzleConnect">
    <v-container grid-list-sm text-xs-center>
      <div class="center" id="circle">
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
import kuzzle from '../service/Kuzzle.js';
import store from '../store.js';

export default {
  name: 'KuzzleConnect',
  methods: {
    async connect() {
      try {
        await kuzzle.connect();
        clearInterval(this.interval);
        const exists = await kuzzle.index.exists('todolists');
        if (!exists) {
          await kuzzle.index.create('todolists');
          const mapping = {
            properties: {
              complete: { type: 'boolean' },
              task: { type: 'text' }
            }
          };
          await kuzzle.collection.create('todolists', 'FirstList', mapping);
        }
      } catch (error) {
        console.error(error);
      }
    }
  },
  mounted() {
    kuzzle
      .addListener('connected', async () => {
        store.commit('setConnection', true);
        this.$router.push({ name: 'home' });
      })
      .addListener('disconnected', () => {
        store.commit('setConnection', false);
        this.$router.push({ name: 'kuzzleConnect' });
      });
    this.interval = setInterval(this.connect, 1000);
  }
};
</script>

<style scoped>
body {
  background-color: #f0f0f0;
}
#KuzzleConnect {
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
