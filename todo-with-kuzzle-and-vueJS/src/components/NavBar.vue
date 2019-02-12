<template>
  <div id="Navbar">
    <v-toolbar dark fixed app :clipped-left="clipped">
      <v-toolbar-side-icon @click.stop="drawer = !this"></v-toolbar-side-icon>
      <v-toolbar-title> TodoMVC </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn color="dark" class="white--text">Welcome !</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-navigation-drawer
      id="NavMobile"
      app
      v-model="drawer"
      absolute
      dark
      temporary
      :clipped="clipped"
      enable-resize-watcher
    >
      <v-list>
        <v-list-tile>
          <v-list-tile-title color="dark" class="white--text">Welcome !</v-list-tile-title>
        </v-list-tile>
        <v-divider light></v-divider>
        <v-list-tile>
          <v-checkbox
          :label="`Toasts: ${this.toasts}`"
          color="dark"
          v-model="toastsEnabled"
          @change="setToastEnabled"
        ></v-checkbox>
        </v-list-tile>
        <v-divider light></v-divider>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
export default {
  name: 'NavBar',
  data() {
    return {
      drawer: false,
      clipped: false,
      success: {
        position: 'bottomRight'
      },
      toasts: 'Enable',
      toastsEnabled: (localStorage.getItem('toastsEnabled') === 'true')
    };
  },
  methods: {
    setToastEnabled() {
      localStorage.setItem('toastsEnabled', this.toastsEnabled);
      this.toasts = (this.ToastsEnabled)? 'Enable': 'Disable';
    },
  },
  mounted() {
    if (localStorage.getItem('toastsEnabled') === null) {
      localStorage.setItem('toastsEnabled', true);
    }
  }
};
</script>

<style scoped>
#Navbar {
  background-color: #ffffff;
}
#NavMobile {
  position:fixed;
  top:0;
  left:0;
}
</style>
