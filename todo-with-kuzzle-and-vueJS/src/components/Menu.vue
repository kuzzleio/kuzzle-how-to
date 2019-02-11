<template>
  <div id="Menucollection">
    <v-layout wrap align-center>
      <v-flex xs12 sm6 md3 >
        <v-checkbox
        class="text-xs-center"
          label="Complete All"
          color="blue"
          @change="SetSelectedTasksComplete"
          v-model="CompleteAllCopy"
          @disabled="this.taskLength <= 0"
        ></v-checkbox>
      </v-flex>
      <v-flex  xs12 sm6 md3 class="text-xs-center" >
        <v-btn color="blue" @click="DeleteSelectedTasks" class="white--text">Clear Completed</v-btn>
      </v-flex>
      <v-flex  xs12 sm6 md3 class="text-xs-center" >
        <v-switch
          label="See Active"
          color="blue"
          v-model="See.Active"
          @change="SetSeeActiveTasks"
        ></v-switch>
      </v-flex>
      <v-flex xs12 sm6 md3 class="text-xs-center">
        <v-switch
          label="See Completed"
          color="blue"
          v-model="See.Completed"
          @change="SetSeeCompletedTasks"
        ></v-switch>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: 'Menucollection',
  props: [
    'CompleteAllTasks',
    'TaskLength',
  ],
  watch: {
    CompleteAllTasks: function CompleteAllchange(NewVal, OldVal) {
      this.CompleteAllCopy = NewVal;
    }
  },
  data() {
    return {
      CompleteAllCopy: this.CompleteAllTasks,
      See: {
        Active: true,
        Completed :true
      }
    };
  },
  methods: {
    SetSelectedTasksComplete() {
      this.$emit('SetSelectedTasksComplete', this.CompleteAllCopy);
    },
    DeleteSelectedTasks() {
      this.$emit('DeleteSelectedTasks');
    },
    SetSeeCompletedTasks() {
      this.$emit('SetSeeCompletedTasks', this.See.Completed);
    },
    SetSeeActiveTasks() {
      this.$emit('SetSeeActiveTasks', this.See.Active);
    }
  },
  mounted() {
    this.CompleteAllCopy= this.CompleteAllTasks;
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
