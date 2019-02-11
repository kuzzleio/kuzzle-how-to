<template>
  <v-app light id="app">
    <v-container grid-list-sm text-xs-center>
      <div>
        <router-view />
      </div>
    </v-container>
  </v-app>
</template>

<script>
export default {
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
