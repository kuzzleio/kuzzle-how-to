<template>
  <div id="Add" class="row">
    <form v-on:submit.prevent="addTask">
      <input
        class="col s8 m4"
        type="text"
        name="todo"
        v-model="input.todo"
        placeholder="TODO"
        v-autofocus
      >
      <a
        class="waves-effect waves-light btn scale-transition col s2 offset-s2"
        v-on:click="addTask"
      >Add</a>
    </form>
  </div>
</template>

<script>
export default {
  name: 'Add',
  data() {
    return {
      input: {
        todo: ''
      }
    };
  },
  methods: {
    async addTask(event) {
      this.$emit('addTask', this.input.todo);
      event.target.reset();
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
