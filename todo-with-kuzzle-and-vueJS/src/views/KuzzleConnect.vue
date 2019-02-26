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
      } catch (error) {
        this.$toast.info(`${error.message}`, 'INFO', {
          position: 'bottomLeft'
        });
      }
    }
  },
  mounted() {
    kuzzle
      .addListener('connected', async () => {
        store.commit('setConnection', true);
        const indexName = this.$store.state.indexName;
        try {
          const exists = await kuzzle.index.exists(indexName);
          if (!exists) {
            await kuzzle.index.create(indexName);
            const mapping = {
              properties: {
                complete: { type: 'boolean' },
                task: { type: 'text' }
              }
            };
            await kuzzle.collection.create(indexName, 'FirstList', mapping);
          }
        } catch (error) {
          console.log(error.message);
        }
        this.$router.push({ name: 'home' });
      })
      .addListener('disconnected', () => {
        store.commit('setConnection', false);
        this.$router.push({ name: 'kuzzleConnect' });
      });
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
