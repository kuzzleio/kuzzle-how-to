<template>
  <div id="Navbar">
    <v-toolbar dark fixed app :clipped-left="Clipped">
      <v-toolbar-side-icon @click.stop="Drawer = !this"></v-toolbar-side-icon>
      <v-toolbar-title> TodoMVC </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn color="dark" class="white--text">Welcome !</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-navigation-drawer
      id="NavMobile"
      app
      v-model="Drawer"
      absolute
      dark
      temporary
      :clipped="Clipped"
      enable-resize-watcher
    >
      <v-list>
        <v-list-tile>
          <v-list-tile-title color="dark" class="white--text">Welcome !</v-list-tile-title>
        </v-list-tile>
        <v-divider light></v-divider>
        <v-list-tile>
          <v-checkbox
          :label="`Toasts: ${this.Toasts}`"
          color="dark"
          v-model="ToastsEnabled"
          @change="SetToastEnabled"
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
      Drawer: false,
      Clipped: false,
      Success: {
        position: 'bottomRight'
      },
      Toasts: 'Enable',
      ToastsEnabled: (localStorage.getItem('ToastsEnabled') === 'true')
    };
  },
  methods: {
    SetToastEnabled() {
      localStorage.setItem('ToastsEnabled', this.ToastsEnabled);
      this.Toasts = (this.ToastsEnabled)? 'Enable': 'Disable';
    },
  },
  mounted() {
    if (localStorage.getItem('ToastsEnabled') === null) {
      localStorage.setItem('ToastsEnabled', true);
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
