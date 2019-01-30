<template>
  <div id="menucollection">
    <label class="col s3">
      <input
        type="checkbox"
        class="filled-in"
        @click="updateSelected"
        v-model="this.completedAll"
        :disabled="this.taskLength <= 0"
      >
      <span>Complete All</span>
    </label>
    <a class="waves-effect waves-light btn col s2" @click="deleteSelected">Clear Completed</a>
    <div class="switch col s3 push-s1">
      <label>
        See Active
        <input type="checkbox" @click="updateActive" v-model="this.seeActive">
        <span class="lever"></span>
      </label>
    </div>
    <div class="switch col s3 push-s1">
      <label>
        See Completed
        <input type="checkbox" @click="updateCompleted" v-model="this.seeCompleted">
        <span class="lever"></span>
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'menucollection',
  props: [
    'collecItems',
    'completedAll',
    'taskLength',
    'seeActive',
    'seeCompleted'
  ],
  methods: {
    updateSelected() {
      this.$emit('updateSelected');
    },
    deleteSelected() {
      this.$emit('deleteSelected');
    },
    updateCompleted() {
      this.$emit('updateCompleted');
    },
    updateActive() {
      this.$emit('updateActive');
    }
  }
};
</script>

<style scoped>
#menucollection {
  background-color: #ffffff;
  border: 1px solid #cccccc;
  padding: 20px;
  margin-top: 10px;
}
</style>
