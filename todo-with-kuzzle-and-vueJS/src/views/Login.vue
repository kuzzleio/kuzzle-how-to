<template>
  <div id="login">
    <v-container>
      <form v-on:submit.prevent="login">
        <v-layout wrap align-center>
          <v-flex xs6 sm12 class="text-xs-center">
            <h1>Login</h1>
          </v-flex>
          <v-flex xs12 sm12 class="text-xs-center">
            <v-text-field autofocus label="Username" outline v-model="Input.username"></v-text-field>
          </v-flex>
          <v-flex xs12 sm12 class="text-xs-center">
            <v-text-field
              label="Password"
              outline
              v-model="Input.password"
              :type="show ? 'text' : 'password'"
              :append-icon="show ? 'visibility_off' : 'visibility'"
              @click:append="show = !show"
            ></v-text-field>
          </v-flex>
          <v-flex xs12 sm12 class="text-xs-center">
            <v-btn color="blue" class="white--text" @click="login">Login</v-btn>
          </v-flex>
        </v-layout>
      </form>
    </v-container>
  </div>
</template>

<script>
import kuzzle from '../service/Kuzzle.js';

export default {
  name: 'Login',
  data() {
    return {
      inverval: null,
      show: false,
      Input: {
        sername: '',
        password: ''
      },
      success: {
        position: 'bottomRight'
      },
      info: {
        position: 'bottomLeft'
      },
      error: {
        position: 'topRight'
      }
    };
  },
  methods: {
    async login(event) {
      if (this.Input.username === '' || this.Input.password === '') {
        this.$toast.error(
          'A username and password must be present!',
          'ERROR',
          this.error
        );
        return;
      }
      const credentials = {
        username: this.Input.username,
        password: this.Input.password
      };
      try {
        const jwt = await kuzzle.auth.login('local', credentials);
        this.$toast.success(
          `Connected as ${this.Input.username} on Kuzzle!`,
          'SUCCESS',
          this.success
        );
        localStorage.setItem('jwt', jwt);
        localStorage.setItem('username', this.Input.username);
        this.$router.push({ name: 'home' });
      } catch (error) {
        this.Input.username = this.Input.password = '';
        this.$toast.error(`${error.message}`, 'ERROR', this.error);
      }
    }
  },
};
</script>

<style scoped>
#login {
  width: 500px;
  border: 1px solid #cccccc;
  background-color: #ffffff;
  margin: auto;
  margin-top: 200px;
  padding: 20px;
}
</style>
