<template>
  <div id="CreateNewTask">
    <form v-on:submit.prevent="addClicked">
      <v-layout wrap align-center>
        <v-flex xs12 sm12 md6 class="text-xs-center">
          <v-text-field autofocus outline label="New todo" v-model="todo" />
        </v-flex>
        <v-flex xs12 sm12 md6 class="text-xs-center">
          <v-btn color="blue" class="white--text" @click="addClicked">
            ADD
          </v-btn>
        </v-flex>
      </v-layout>
    </form>
  </div>
</template>

<script>
export default {
  name: 'CreateNewTask',
  data() {
    return {
      todo: ''
    };
  },
  methods: {
    async addClicked(event) {
      this.$emit('addClicked', this.todo);
    }
  }
};
</script>

<style scoped>
#CreateNewTask {
  background-color: #ffffff;
  border: 1px solid #cccccc;
  padding: 20px;
  margin-top: 10px;
}
</style>
