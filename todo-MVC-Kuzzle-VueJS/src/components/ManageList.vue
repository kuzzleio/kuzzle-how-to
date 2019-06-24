<template>
  <div id="ManageList">
    <v-layout wrap align-center row>
      <CreateNewList
        v-if="modal"
        :modal="modal"
        @cancelClicked="onCancel"
        @createClicked="onCreate"
      />
      <v-flex xs12 sm12 md6 class="text-xs-center">
        <v-select
          outline
          label="Please choose a list"
          item-text="text"
          item-value="value"
          :items="lists"
          v-model="currentListCopy"
          @input="currentListChanged"
        />
      </v-flex>
      <v-flex xs12 sm12 md6 class="text-xs-center">
        <v-btn color="blue" class="white--text" @click="newListClicked">
          New List
        </v-btn>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import CreateNewList from './CreateNewList';

export default {
  name: 'ManageList',
  components: {
    CreateNewList
  },
  props: ['lists', 'currentList'],
  watch: {
    currentList: function handler(newVal, oldVal) {
      this.currentListCopy = newVal.value;
    }
  },
  data() {
    return {
      currentListCopy: '',
      modal: false
    };
  },
  methods: {
    currentListChanged() {
      this.$emit('currentListChanged', this.currentListCopy);
    },
    newListClicked() {
      this.modal = true;
    },
    onCancel() {
      this.modal = false;
    },
    onCreate(input) {
      this.modal = false;
      this.$emit('createList', input);
    }
  },
  mounted() {
    this.currentListCopy = this.currentList.value;
  }
};
</script>

<style scoped>
#ManageList {
  background-color: #ffffff;
  border: 1px solid #cccccc;
  padding: 20px;
  margin-top: 10px;
}
</style>
