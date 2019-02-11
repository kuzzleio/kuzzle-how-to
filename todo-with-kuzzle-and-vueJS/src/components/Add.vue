<template>
  <div id="Add">
    <form v-on:submit.prevent="AddTask">
      <v-layout wrap align-center>
        <v-flex xs12 sm12 md6 class="text-xs-center">
          <v-text-field autofocus label="New todo" outline v-model="Todo"></v-text-field>
        </v-flex>
        <v-flex xs12 sm12 md6 class="text-xs-center">
          <v-btn color="blue" v-on:click="AddTask" class="white--text">ADD</v-btn>
        </v-flex>
      </v-layout>
    </form>
  </div>
</template>

<script>
export default {
  name: 'Add',
  data() {
    return {
      Todo: ''
    };
  },
  methods: {
    async AddTask(event) {
      this.$emit('AddTask', this.Todo);
    }
  }
};
</script>

<style scoped>
#Add {
  background-color: #ffffff;
  border: 1px solid #cccccc;
  padding: 20px;
  margin-top: 10px;
}
</style>
