<template>
  <div id="ManageList">
    <v-layout wrap align-center row>
      <ModalList :Modal="Modal" @Cancel="Cancel" @Create="Create" v-if="Modal"/>
      <v-flex xs12 sm12 md6 class="text-xs-center">
        <v-select
          item-text="text"
          item-value="value"
          @input="Changed"
          :items="Lists"
          label="Please choose a list"
          outline
          v-model="CurrentListCopy.value"
        ></v-select>
      </v-flex>
      <v-flex xs12 sm12 md6 class="text-xs-center">
        <v-btn color="blue" @click="NewList()" class="white--text">New List</v-btn>
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
  props: ['Lists', 'CurrentList'],
  watch: {
    CurrentList: function CurrentListChanged(NewVal, OldVal) {
      this.CurrentListCopy = NewVal;
    }
  },
  data() {
    return {
      CurrentListCopy: { text: this.CurrentList.text, value: this.CurrentList.value },
      Modal: false
    };
  },
  methods: {
    Changed() {
      this.$emit('SetCurrentList', this.CurrentListCopy);
    },
    NewList() {
      this.Modal = true;
    },
    Cancel() {
      this.Modal = false;
    },
    Create(input) {
      this.Modal = false;
      this.$emit('CreateList', input);
    }
  },
  mounted() {
    this.CurrentListCopy = this.CurrentList;
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
