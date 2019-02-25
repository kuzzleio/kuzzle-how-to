<template>
  <div id="ManageList">
    <v-layout wrap align-center row>
      <ModalList
        :modal="modal"
        @cancel="cancel"
        @create="create"
        v-if="modal"
      />
      <v-flex xs12 sm12 md6 class="text-xs-center">
        <v-select
          outline
          label="Please choose a list"
          item-text="text"
          item-value="value"
          :items="lists"
          v-model="currentListCopy.value"
          @input="changed"
        />
      </v-flex>
      <v-flex xs12 sm12 md6 class="text-xs-center">
        <v-btn color="blue" class="white--text" @click="newList()">
          New List
        </v-btn>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import ModalList from './ModalList';

export default {
  name: 'ManageList',
  components: {
    ModalList
  },
  props: ['lists', 'currentList'],
  watch: {
    currentList: function currentListChanged(newVal, oldVal) {
      this.currentListCopy = newVal;
    }
  },
  data() {
    return {
      currentListCopy: {
        text: this.currentList.text,
        value: this.currentList.value
      },
      modal: false
    };
  },
  methods: {
    changed() {
      this.$emit('setCurrentList', this.currentListCopy);
    },
    newList() {
      this.modal = true;
    },
    cancel() {
      this.modal = false;
    },
    create(input) {
      this.modal = false;
      this.$emit('createList', input);
    }
  },
  mounted() {
    this.currentListCopy = this.currentList;
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
