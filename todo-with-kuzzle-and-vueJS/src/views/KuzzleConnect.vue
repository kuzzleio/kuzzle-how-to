<template>
  <v-app light id="KuzzleConnect">
    <v-container grid-list-sm text-xs-center>
      <div class="center" id="circle">
        <v-progress-circular :size="100" :width="10" color="blue" indeterminate></v-progress-circular>
      </div>
    </v-container>
  </v-app>
</template>

<script>
import kuzzle from '../service/Kuzzle.js';

export default {
  name: 'KuzzleConnect',
  data() {
    return {
      indexName: 'todolists'
    };
  },
  methods: {
    async connect() {
      try {
        await kuzzle.connect();
        clearInterval(this.interval);
        const exists = await kuzzle.index.exists(this.indexName);
        if (!exists) {
          await kuzzle.index.create(this.indexName);
          const mapping = {
            properties: {
              complete: { type: 'boolean' },
              task: { type: 'text' }
            }
          };
          await kuzzle.collection.create(this.indexName, 'FirstList', mapping);
        }
        localStorage.setItem('indexName', this.indexName);
        localStorage.setItem('connectedToKuzzle', true);
        this.$router.push({ name: 'home' });
      } catch (error) {
        this.$toast.info(`${error.message}`, 'INFO', {position: 'bottomLeft'});
        window.localStorage.setItem('connectedToKuzzle', false);
      }
    }
  },
  mounted() {
    if (!localStorage.getItem('connectedToKuzzle')) {
      localStorage.setItem('connectedToKuzzle', false);
    }
    this.interval = setInterval(this.connect, 200);
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
