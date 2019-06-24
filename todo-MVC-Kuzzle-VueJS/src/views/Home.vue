<template>
  <div id="Home">
    <NavBar></NavBar>
    <v-container fluid grid-list-xl text-xs-center>
      <ManageList
        :lists="lists"
        :currentList="currentList"
        @currentListChanged="onCurrentListChanged"
        @createList="onCreateList"
      />
      <CreateNewTask class="row col s8" @addClicked="onAddClicked" />
      <ManageTasks
        class="row"
        :completeAll="completeAll"
        :disableCompleteAll="tasks.length <= 0"
        @completeAllChanged="onCompleteAllChanged"
        @deleteCompletedClicked="onDeleteCompletedClicked"
        @seeActiveChanged="onSeeActiveChanged"
        @seeCompletedChanged="onSeeCompletedChanged"
      />
      <v-list one-line>
        <template v-for="task in tasks">
          <Task
            :key="task.index"
            :task="task"
            @deleteClicked="onDeleteClicked"
            @completeChanged="onCompleteChanged"
          />
        </template>
      </v-list>
    </v-container>
  </div>
</template>

<script>
import kuzzle from '../service/Kuzzle';

import ManageTasks from '../components/ManageTasks';
import CreateNewTask from '../components/CreateNewTask';
import Task from '../components/Task';
import ManageList from '../components/ManageList';
import NavBar from '../components/NavBar';

export default {
  name: 'Home',
  components: {
    ManageList,
    CreateNewTask,
    ManageTasks,
    Task,
    NavBar
  },

  data() {
    return {
      seeUncompleted: true,
      seeCompleted: true
    };
  },

  computed: {
    completeAll() {
      let completeValue = true;
      this.tasks.some(elem => {
        if (!elem.complete) {
          completeValue = false;
          return false;
        }
      });
      return completeValue;
    },
    lists() {
      return this.$store.getters['lists/GET_LISTS'];
    },
    tasks() {
      return this.$store.getters['tasks/GET_TASKS'](
        this.seeUncompleted,
        this.seeCompleted
      );
    },
    currentList() {
      return this.$store.getters['lists/GET_CURRENT_LIST'];
    },
    notification() {
      return this.$store.state.app.notification;
    }
  },
  watch: {
    notification: function handler(lastNotification) {
      if (
        lastNotification.type &&
        lastNotification.id &&
        lastNotification.action
      ) {
        const text = `ACTION: ${lastNotification.action} ID: ${
          lastNotification.id
        }`;
        this.toasted(lastNotification.type, text);
      }
    }
  },

  async mounted() {
    await this.$store.dispatch('lists/CREATE_GROUP_LIST', {
      kuzzle,
      groupListName: 'todolists'
    });
    await this.fetchIndex();
  },

  methods: {
    toasted(type, message) {
      if (localStorage.getItem('toastsEnabled') === 'false') {
        return;
      }
      const position = {
        position: 'bottomRight'
      };
      switch (type) {
        case 'info':
          this.$toast.info(message, 'INFO', position);
          break;
        case 'error':
          this.$toast.error(message, 'ERROR', position);
          break;
        case 'success':
          this.$toast.success(message, 'SUCCESS', position);
          break;
      }
    },

    async fetchIndex() {
      try {
        await this.$store.dispatch('lists/FETCH_LISTS', { kuzzle });
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    },

    // ManageList
    async onCurrentListChanged(listName) {
      try {
        await this.$store.dispatch('lists/SET_CURRENT_LIST', {
          kuzzle,
          listName
        });
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    },
    async onCreateList(input) {
      try {
        await this.$store.dispatch('lists/CREATE_LIST', {
          kuzzle,
          listName: input
        });
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    },

    // CreateNewTask
    async onAddClicked(message) {
      this.onSeeActiveChanged(true);
      if (message === '') {
        return this.toasted('error', 'Cannot add empty todo!');
      }
      try {
        await this.$store.dispatch('tasks/CREATE_TASK', { kuzzle, message });
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    },

    // ManageTasks
    async onDeleteCompletedClicked() {
      try {
        await this.$store.dispatch('tasks/DELETE_COMPLETED_TASKS', { kuzzle });
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    },
    async onCompleteAllChanged(newValue) {
      try {
        const action = newValue
          ? 'tasks/SET_ALL_TASKS_COMPLETE'
          : 'tasks/UNSET_ALL_TASKS_COMPLETE';
        await this.$store.dispatch(action, { kuzzle });
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    },
    onSeeActiveChanged(newValue) {
      this.seeUncompleted = newValue;
    },
    onSeeCompletedChanged(newValue) {
      this.seeCompleted = newValue;
    },

    // Task
    async onDeleteClicked(index) {
      try {
        await this.$store.dispatch('tasks/DELETE_TASK', {
          kuzzle,
          taskId: index
        });
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    },
    async onCompleteChanged(index, newValue) {
      try {
        const action = newValue
          ? 'tasks/SET_TASK_COMPLETE'
          : 'tasks/UNSET_TASK_COMPLETE';
        await this.$store.dispatch(action, { kuzzle, taskId: index });
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    }
  }
};
</script>

<style scoped>
#Home {
  max-width: 1024px;
  background-color: #ffffff;
  border: 1px solid #cccccc;
  padding: auto;
  margin: auto;
  margin-top: 100px;
}
</style>
