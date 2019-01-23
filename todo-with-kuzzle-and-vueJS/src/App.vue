<template>
  <div id="app">
   <NavBar v-on:logout="logout" v-if="authenticated" :username="this.username"></NavBar>
    <div id="nav">
    </div>
    <router-view @authenticated="setAuthenticated" @username="setUsername" />
  </div>
</template>

<script>
  /* eslint-disable */

  import NavBar from "./components/navbar.vue"

  export default {
    name: 'App',
    components: {NavBar},
    data() {
      return {
        authenticated: false,
        username: ""
      }
    },
    mounted() {
      if(!this.authenticated) {
        this.$router.replace({ name: "login" });
      }
    },
    methods: {
      setUsername(username) {
        this.username = username;
      },
      setAuthenticated(status) {
        this.authenticated = status;
      },
      logout() {
        this.authenticated = false;
      }
    }
  }
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