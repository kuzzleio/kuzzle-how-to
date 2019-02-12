<template>
  <div id="task">
    <v-layout wrap align-center>
      <v-flex xs12 sm12 md9 class="text-xs-center" >
        <v-checkbox
          :label="`${this.message}`"
          color="blue"
          v-model="completeCopy"
          @change="setTaskComplete"
        ></v-checkbox>
      </v-flex>
      <v-flex xs12 sm12 md3 class="text-xs-center">
        <v-btn color="blue" @click="deleteTask" class="white--text">Clear</v-btn>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: 'task',
  props: ['complete', 'index', 'message'],
  watch: {
    complete: function completeAll(newVal, oldVal) {
      this.completeCopy = newVal;
    }
  },
  data () {
    return {
      completeCopy: this.complete
    };
  },
  methods: {
    deleteTask() {
      this.$emit('deleteTask', this.index);
    },
    setTaskComplete() {
      this.$emit('setTaskComplete', this.index, this.completeCopy);
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
