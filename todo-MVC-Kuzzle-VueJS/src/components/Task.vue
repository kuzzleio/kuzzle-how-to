<template>
  <div id="Task">
    <v-layout wrap align-center>
      <v-flex xs12 sm12 md9 class="text-xs-center">
        <v-checkbox
          color="blue"
          :label="task.message"
          v-model="completeCopy"
          @change="completeChanged"
        ></v-checkbox>
      </v-flex>
      <v-flex xs12 sm12 md3 class="text-xs-center">
        <v-btn color="blue" class="white--text" @click="deleteClicked">
          Clear
        </v-btn>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: 'Task',
  props: ['task'],
  watch: {
    task(newVal, oldVal) {
      this.completeCopy = newVal.complete;
    },
    deep: true
  },
  data() {
    return {
      completeCopy: this.task.complete
    };
  },
  methods: {
    deleteClicked() {
      this.$emit('deleteClicked', this.task.index);
    },
    completeChanged() {
      this.$emit('completeChanged', this.task.index, this.completeCopy);
    }
  }
};
</script>

<style scoped>
#Task {
  background-color: #ffffff;
  border: 1px solid #cccccc;
  padding: 20px;
  margin-top: 10px;
}
</style>
