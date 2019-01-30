<template>
  <div id="task">
    <label class="col s3">
      <input v-model="this.complete" type="checkbox" class="filled-in" @click="updateTask">
      <span>{{ this.message }}</span>
    </label>
    <a href="#" class="secondary-content">
      <i class="badge" @click="deleteTask">Clear</i>
    </a>
  </div>
</template>

<script>
export default {
  name: 'task',
  props: ['complete', 'index', 'message'],
  methods: {
    deleteTask() {
      this.$emit('deleteTask', this.index);
    },
    updateTask() {
      this.$emit('updateTask', this.index);
    }
  }
};
</script>

<style scoped>
#task {
  background-color: #ffffff;
  border: 1px solid #cccccc;
  padding: 20px;
  margin-top: 10px;
}
</style>
