<template>
  <div id="task">
    <v-layout wrap align-center>
      <v-flex xs12 sm12 md9 class="text-xs-center" >
        <v-checkbox
          :label="`${this.Message}`"
          color="blue"
          v-model="CompleteCopy"
          @change="SetTaskComplete"
        ></v-checkbox>
      </v-flex>
      <v-flex xs12 sm12 md3 class="text-xs-center">
        <v-btn color="blue" @click="DeleteTask" class="white--text">Clear</v-btn>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: 'task',
  props: ['Complete', 'Index', 'Message'],
  watch: {
    Complete: function completeAll(NewVal, OldVal) {
      this.CompleteCopy = NewVal;
    }
  },
  data () {
    return {
      CompleteCopy: this.Complete
    };
  },
  methods: {
    DeleteTask() {
      this.$emit('DeleteTask', this.Index);
    },
    SetTaskComplete() {
      this.$emit('SetTaskComplete', this.Index, this.CompleteCopy);
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
