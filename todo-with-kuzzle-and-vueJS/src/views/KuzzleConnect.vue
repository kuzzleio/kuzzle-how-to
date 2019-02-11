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
      IndexName: 'todolists'
    };
  },
  methods: {
    async connect() {
      try {
        await kuzzle.connect();
        clearInterval(this.interval);
        const exists = await kuzzle.index.exists(this.IndexName);
        if (!exists) {
          await kuzzle.index.create(this.IndexName);
          const Mapping = {
            properties: {
              Complete: { type: 'boolean' },
              Task: { type: 'text' }
            }
          };
          await kuzzle.collection.create(this.IndexName, 'FirstList', Mapping);
        }
        localStorage.setItem('IndexName', this.IndexName);
        localStorage.setItem('connected2kuzzle', true);
        this.$router.push({ name: 'home' });
      } catch (error) {
        this.$toast.info(`${error.message}`, 'INFO', {position: 'bottomLeft'});
        window.localStorage.setItem('connected2kuzzle', false);
      }
    }
  },
  mounted() {
    if (!localStorage.getItem('connected2kuzzle')) {
      localStorage.setItem('connected2kuzzle', false);
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
