<template>
  <div id="app">
    <router-view v-if="this.isConnected === true"/>
    <div v-else class="center">
      <div class="row">
        <div class="col s6 offset-s3 alignV">
          <div class="card blue-grey darken-1">
            <div class="card-content white-text">
              <span class="card-title">Connecting to Kuzzle</span>
                <div class="preloader-wrapper big active center">
                  <div class="spinner-layer spinner-teal-only">
                    <div class="circle-clipper left">
                      <div class="circle"></div>
                    </div><div class="gap-patch">
                      <div class="circle"></div>
                    </div><div class="circle-clipper right">
                    <div class="circle">
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-action">
              <a href="https://docs.kuzzle.io/guide/getting-started/">Kuzzle Doc</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import kuzzle from '../service/Kuzzle';

export default {
  data() {
    return {
      isConnected: false,
      inverval: null
    };
  },
  methods: {
    async connect() {
      try {
        await kuzzle.connect();
        this.isConnected = true;
        clearInterval(this.interval);
      } catch (error) {
        this.isConnected = false;
      }
    }
  },
  mounted() {
    this.interval = setInterval(this.connect, 200);
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
  .alignV {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
</style>
