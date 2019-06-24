<template>
  <div id="ManageTasks">
    <v-layout wrap align-center>
      <v-flex xs12 sm6 md3>
        <v-checkbox
          class="text-xs-center"
          label="Complete All"
          color="blue"
          v-model="completeAllCopy"
          @change="completeAllChanged"
          @disabled="disableCompleteAll"
        ></v-checkbox>
      </v-flex>
      <v-flex xs12 sm6 md3 class="text-xs-center">
        <v-btn color="blue" class="white--text" @click="deleteCompletedClicked">
          Clear Completed
        </v-btn>
      </v-flex>
      <v-flex xs12 sm6 md3 class="text-xs-center">
        <v-switch
          label="See Active"
          color="blue"
          v-model="see.active"
          @change="seeActiveChanged"
        ></v-switch>
      </v-flex>
      <v-flex xs12 sm6 md3 class="text-xs-center">
        <v-switch
          label="See Completed"
          color="blue"
          v-model="see.completed"
          @change="seeCompletedChanged"
        ></v-switch>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: 'ManageTasks',
  props: ['completeAll', 'disableCompleteAll'],
  watch: {
    completeAll: {
      immediate: true,
      handler(newVal, oldVal) {
        this.completeAllCopy = newVal;
      }
    }
  },
  data() {
    return {
      completeAllCopy: this.completeAll,
      see: {
        active: true,
        completed: true
      }
    };
  },
  methods: {
    completeAllChanged() {
      this.$emit('completeAllChanged', this.completeAllCopy);
    },
    deleteCompletedClicked() {
      this.$emit('deleteCompletedClicked');
    },
    seeCompletedChanged() {
      this.$emit('seeCompletedChanged', this.see.completed);
    },
    seeActiveChanged() {
      this.$emit('seeActiveChanged', this.see.active);
    }
  }
};
</script>

<style scoped>
#ManageTasks {
  background-color: #ffffff;
  border: 1px solid #cccccc;
  padding: 20px;
  margin-top: 10px;
}
</style>
