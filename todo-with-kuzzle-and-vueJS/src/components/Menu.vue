<template>
  <div id="Menucollection">
    <v-layout wrap align-center>
      <v-flex xs12 sm6 md3 >
        <v-checkbox
        class="text-xs-center"
          label="Complete All"
          color="blue"
          @change="setSelectedTasksComplete"
          v-model="completeAllCopy"
          @disabled="this.taskLength <= 0"
        ></v-checkbox>
      </v-flex>
      <v-flex  xs12 sm6 md3 class="text-xs-center" >
        <v-btn color="blue" @click="deleteSelectedTasks" class="white--text">Clear Completed</v-btn>
      </v-flex>
      <v-flex  xs12 sm6 md3 class="text-xs-center" >
        <v-switch
          label="See Active"
          color="blue"
          v-model="see.active"
          @change="setSeeActiveTasks"
        ></v-switch>
      </v-flex>
      <v-flex xs12 sm6 md3 class="text-xs-center">
        <v-switch
          label="See Completed"
          color="blue"
          v-model="see.completed"
          @change="setSeeCompletedTasks"
        ></v-switch>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: 'Menucollection',
  props: [
    'completeAllTasks',
    'taskLength',
  ],
  watch: {
    completeAllTasks: function completeAllchange(newVal, oldVal) {
      this.completeAllCopy = newVal;
    }
  },
  data() {
    return {
      completeAllCopy: this.completeAllTasks,
      see: {
        active: true,
        completed :true
      }
    };
  },
  methods: {
    setSelectedTasksComplete() {
      this.$emit('setSelectedTasksComplete', this.completeAllCopy);
    },
    deleteSelectedTasks() {
      this.$emit('deleteSelectedTasks');
    },
    setSeeCompletedTasks() {
      this.$emit('setSeeCompletedTasks', this.see.completed);
    },
    setSeeActiveTasks() {
      this.$emit('setSeeActiveTasks', this.see.active);
    }
  },
  mounted() {
    this.completeAllCopy= this.completeAllTasks;
  }
};
</script>

<style scoped>
#Menucollection {
  background-color: #ffffff;
  border: 1px solid #cccccc;
  padding: 20px;
  margin-top: 10px;
}
</style>
