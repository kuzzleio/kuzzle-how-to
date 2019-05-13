<template>
  <div id="Home">
    <NavBar></NavBar>
    <v-container fluid grid-list-xl text-xs-center>
      <ManageList
        :lists="lists"
        :currentList="currentList"
        @setCurrentList="setCurrentList"
        @createList="createList"
      />
      <Add class="row col s8" @addTask="addTask" />
      <MenuCollection
        class="row"
        :completeAllTasks="this.completeAllTasks"
        :taskLength="this.tasks.length"
        @setSelectedTasksComplete="setSelectedTasksComplete"
        @deleteSelectedTasks="deleteSelectedTasks"
        @setSeeActiveTasks="setSeeActiveTasks"
        @setSeeCompletedTasks="setSeeCompletedTasks"
      />
      <v-list one-line>
        <template v-for="task in this.tasks">
          <Task
            v-show="
              (task.complete && seeCompletedTasks) ||
                (!task.complete && seeActiveTasks)
            "
            :key="task.index"
            :complete="task.complete"
            :index="task.index"
            :message="task.message"
            @deleteTask="deleteTask"
            @setTaskComplete="setTaskComplete"
          />
        </template>
      </v-list>
    </v-container>
  </div>
</template>

<script>
import kuzzle from '../service/Kuzzle';

import MenuCollection from '../components/Menu';
import Add from '../components/Add';
import Task from '../components/Task';
import ManageList from '../components/ManageList';
import NavBar from '../components/NavBar';

export default {
  name: 'Home',
  components: {
    ManageList,
    Add,
    MenuCollection,
    Task,
    NavBar
  },
  data() {
    return {
      lists: [{ text: 'NameOfTheList', value: 'NameOfTheList' }],
      tasks: [
        {
          message: 'messageOfTheTask',
          index: 0,
          complete: false
        }
      ],
      completeAllTasks: false,
      seeActiveTasks: true,
      seeCompletedTasks: true,
      currentList: { text: 'build', value: 'build' },
      indexName: 'todolists',
      roomId: ''
    };
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

    updateCompleteAll() {
      let completeValue = true;
      this.tasks.some(elem => {
        if (!elem.complete) {
          completeValue = false;
          return false;
        }
      });
      if (completeValue !== this.completeAllTasks) {
        this.completeAllTasks = completeValue;
      }
    },

    async fetchIndex() {
      this.lists = [];
      try {
        const collectionList = await kuzzle.collection.list(this.indexName);
        this.lists = collectionList.collections.map(elem => ({
          text: elem.name,
          value: elem.name
        }));
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    },

    async fetchCollection() {
      this.tasks = [];
      let results = {};
      try {
        results = await kuzzle.document.search(
          this.indexName,
          this.currentList.value,
          { sort: ['_kuzzle_info.createdAt'] },
          { size: 100 }
        );
        this.tasks = results.hits.map(hit => {
          return {
            message: hit._source.task,
            index: hit._id,
            complete: hit._source.complete
          };
        });
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    },

    async setCurrentList(collection) {
      if (collection.value === '') {
        this.tasks = [];
        this.updateCompleteAll();
        return;
      }
      try {
        this.currentList = { text: collection.text, value: collection.value };
        await this.fetchIndex();
        await this.fetchCollection();
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
      this.updateCompleteAll();
    },

    async createList(input) {
      const mapping = {
        properties: {
          complete: { type: 'boolean' },
          task: { type: 'text' }
        }
      };
      try {
        await kuzzle.collection.create(this.indexName, input, mapping);
        this.setCurrentList({ text: input, value: input });
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    },

    async deleteTask(index) {
      try {
        await kuzzle.document.delete(
          this.indexName,
          this.currentList.value,
          index
        );
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
      this.updateCompleteAll();
    },

    async setTaskComplete(index, newValue) {
      try {
        await kuzzle.document.update(
          this.indexName,
          this.currentList.value,
          index,
          {
            complete: newValue
          }
        );
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
      this.updateCompleteAll();
    },

    async deleteSelectedTasks() {
      let deleted = false;
      this.tasks.forEach(async elem => {
        if (elem.complete === true) {
          deleted = true;
          await this.deleteTask(elem.index);
        }
      });

      if (deleted === false) {
        this.toasted('error', 'No task completed!');
        return;
      }
      this.updateCompleteAll();
    },

    async setSelectedTasksComplete(newValue) {
      if (this.tasks.length === 0) {
        this.toasted('error', 'Nothing to complete');
        this.completeAllTasks = false;
        return;
      }
      this.completeAllTasks = newValue;
      this.tasks.forEach(async elem => {
        if (elem.complete !== this.completeAllTasks) {
          await this.setTaskComplete(elem.index, newValue);
        }
      });
      this.updateCompleteAll();
    },

    setSeeActiveTasks(seeActiveValue) {
      this.seeActiveTasks = seeActiveValue;
      this.updateCompleteAll();
    },

    setSeeCompletedTasks(seeCompletedValue) {
      this.seeCompletedTasks = seeCompletedValue;
      this.updateCompleteAll();
    },

    async addTask(message) {
      if (!this.seeActiveTasks) {
        this.setSeeActiveTasks();
      }
      if (message === '') {
        this.toasted('error', 'Cannot add empty todo!');
        return;
      }
      try {
        await kuzzle.document.create(this.indexName, this.currentList.value, {
          task: message,
          complete: false
        });
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
      this.updateCompleteAll();
    },
    notificationsCallback(notification) {
      if (notification.type === 'document') {
        const { _source: newTask, _id: taskId } = notification.result;
        switch (notification.action) {
          case 'create':
            this.tasks.push({
              message: newTask.task,
              index: taskId,
              complete: newTask.complete,
              displayed: true
            });
            this.toasted('info', `New task ${newTask.task}`);
            break;
          case 'delete':
            this.tasks = this.tasks.filter(task => task.index !== taskId);
            this.toasted('info', `Task ${taskId} deleted`);
            break;
          case 'update':
            this.tasks.find(task => task.index === taskId).complete =
              newTask.complete;
            this.toasted('info', `Task ${newTask.task} updated`);
            break;
        }
        this.updateCompleteAll();
      }
    },
    async notificationSubscribe() {
      try {
        this.roomId = await kuzzle.realtime.subscribe(
          this.indexName,
          this.currentList.value,
          {},
          this.notificationsCallback
        );
      } catch (error) {
        this.toasted('error', `${error.message}`);
      }
    }
  },
  async mounted() {
    this.seeActiveTasks = true;
    this.seeCompletedTasks = true;
    try {
      await this.fetchIndex();
      this.currentList.text = this.lists[0].text;
      this.currentList.value = this.lists[0].value;
      await this.fetchCollection();
      this.updateCompleteAll();
      await this.notificationSubscribe();
    } catch (error) {
      this.toasted('error', `${error.message}`);
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
