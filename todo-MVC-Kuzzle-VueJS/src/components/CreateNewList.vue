<template>
  <div id="CreateNewList">
    <v-layout row justify-center>
      <v-dialog max-width="290" v-model="modal">
        <v-card>
          <v-card-title class="headline">Creating new List</v-card-title>
          <v-card-text>
            <v-text-field
              autofocus
              outline
              label="New list name."
              v-model="input"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue" flat="flat" @click="cancelClicked"
              >Cancel</v-btn
            >
            <v-btn color="blue" flat="flat" @click="createClicked"
              >Create</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: 'CreateNewList',
  props: ['modal'],
  data() {
    return {
      input: ''
    };
  },
  methods: {
    cancelClicked() {
      this.$emit('cancelClicked');
    },
    createClicked() {
      this.$emit('createClicked', this.input);
    }
  }
};
</script>
