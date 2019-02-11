<template>
  <div id="ModalList">
    <v-layout row justify-center>
      <v-dialog v-model="Modal" max-width="290">
        <v-card>
          <v-card-title class="headline">Creating new List</v-card-title>
          <v-card-text>
          <v-text-field autofocus label="New list name." outline v-model="Input"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue" flat="flat" @click="Cancel">Cancel</v-btn>
            <v-btn color="blue" flat="flat" @click="Create">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: 'ModalList',
  props: ['Modal'],
  data() {
    return {
      Input: ''
    };
  },
  methods: {
    Cancel() {
      this.$emit('Cancel');
    },
    Create() {
      this.$emit('Create', this.Input);
    }
  }
};
</script>

<style scoped>
</style>
