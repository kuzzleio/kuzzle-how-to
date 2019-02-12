<template>
  <div id="ModalList">
    <v-layout row justify-center>
      <v-dialog v-model="modal" max-width="290">
        <v-card>
          <v-card-title class="headline">Creating new List</v-card-title>
          <v-card-text>
          <v-text-field autofocus label="New list name." outline v-model="input"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue" flat="flat" @click="cancel">Cancel</v-btn>
            <v-btn color="blue" flat="flat" @click="create">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: 'ModalList',
  props: ['modal'],
  data() {
    return {
      input: ''
    };
  },
  methods: {
    cancel() {
      this.$emit('cancel');
    },
    create() {
      this.$emit('create', this.input);
    }
  }
};
</script>

<style scoped>
</style>
