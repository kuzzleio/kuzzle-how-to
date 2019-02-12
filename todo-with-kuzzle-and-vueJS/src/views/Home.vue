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
      <Add class="row col s8" @addTask="addTask"/>
      <MenuCollection
        class="row"
        @deleteSelectedTasks="deleteSelectedTasks"
        @setSelectedTasksComplete="setSelectedTasksComplete"
        :completeAllTasks="this.completeAllTasks"
        :taskLength="this.tasks.length"
        @setSeeActiveTasks="setSeeActiveTasks"
        @setSeeCompletedTasks="setSeeCompletedTasks"
      />
      <v-list one-line>
        <template v-for="task in this.tasks">
          <Task
            :key="task.index"
            v-if="task.displayed === true"
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
      lists: [{ text: 'nameOfTheList', value: 'nameOfTheList' }],
      tasks: [
        {
          message: 'messageOfTheTask',
          index: 0,
          complete: false,
          displayed: true
        }
      ],
      completeAllTasks: false,
      seeActiveTasks: true,
      seeCompletedTasks: true,
      currentList: { text: 'build', value: 'build' },
      currentRoomId: '',
      indexName: localStorage.getItem('indexName'),
      success: {
        position: 'bottomRight'
      },
      info: {
        position: 'bottomLeft'
      },
      error: {
        position: 'topRight'
      },
    };
  },
  methods: {
    toasted(type, message) {
      if (localStorage.getItem('toastsEnabled') === 'false') {
        return;
      }
      switch (type) {
        case 'info':
          this.$toast.info(message, 'INFO', this.info);
          break;
        case 'error':
          this.$toast.error(message, 'ERROR', this.error);
          break;
        case 'success':
          this.$toast.success(message, 'SUCCESS', this.success);
          break;
      }
    },
    async subscribeDoc() {
      try {
        const filter = {};
        const callback = notification => {
          if (notification.type === 'document') {
            const { _source: newTask, _id: taskId } = notification.result;
            switch (notification.action) {
              case 'create':
                this.toasted('info',`New task ${newTask.task}`);
                this.tasks.push({
                  message: newTask.task,
                  index: taskId,
                  complete: newTask.complete,
                  displayed: true
                });
                break;
              case 'delete':
                this.toasted('info',`Task ${taskId} deleted`);
                this.tasks = this.tasks.filter(task => task.index !== taskId);
                break;
              case 'update':
                this.toasted('info',`Task ${newTask.task} updated`);
                this.tasks.find(task => task.index === taskId).complete =
                  newTask.complete;
                break;
            }
            this.updateDisplay();
          }
        };
        this.currentRoomId = await kuzzle.realtime.subscribe(
          this.indexName,
          this.currentList.value,
          filter,
          callback
        );
        this.toasted('info',`Successfully subscribed to ${this.currentList.value} notifications!`);
      } catch (error) {
        this.toasted('error',`${error.message}`);
      }
    },

    updateDisplay() {
      this.tasks.forEach(elem => {
        elem.displayed = (elem.complete && this.seeCompletedTasks) || (!elem.complete && this.seeActiveTasks);
      });
      this.updateCompleteAll();
    },

    setSeeActiveTasks(seeActiveValue) {
      this.seeActiveTasks = seeActiveValue;
      this.updateDisplay();
    },

    setSeeCompletedTasks(seeCompletedValue) {
      this.seeCompletedTasks = seeCompletedValue;
      this.updateDisplay();
    },

    async addTask(message) {
      if (!this.seeActiveTasks) {
        this.setSeeActiveTasks();
      }
      if (message === '') {
        this.toasted('error','Cannot add empty todo!');
        return;
      }
      try {
        await kuzzle.document.create(this.indexName, this.currentList.value, {
          task: message,
          complete: false
        });
      } catch (error) {
        this.toasted('error',`${error.message}`);
      }
    },

    async deleteTask(index) {
      try {
        await kuzzle.document.delete(this.indexName, this.currentList.value, index);
      } catch (error) {
        this.toasted('error',`${error.message}`);
      }
    },

    async setTaskComplete(index, newValue) {
      try {
        this.tasks.find(task => task.index === index).complete = newValue;
        await kuzzle.document.update(this.indexName, this.currentList.value, index, {
          complete: newValue
        });
      } catch (error) {
        this.toasted('error',`${error.message}`);
      }
      this.updateDisplay();
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
        this.toasted('error','No task completed!');
        return;
      }
      this.updateDisplay();
    },

    async setSelectedTasksComplete(newValue) {
      if (this.tasks.length === 0) {
        this.toasted('error','Nothing to complete');
        this.completeAllTasks = false;
        return;
      }
      this.completeAllTasks = newValue;
      this.tasks.forEach(async elem => {
        if (elem.displayed) {
          if (elem.complete !== this.completeAllTasks) {
            await this.setTaskComplete(elem.index, newValue);
          }
        }
      });
      this.updateDisplay();
    },

    updateCompleteAll() {
      let completeValue = true;
      this.tasks.some(elem => {
        if (elem.displayed && !elem.complete) {
          completeValue = false;
          return false;
        }
      });
      if (completeValue !== this.completeAllTasks) {
        this.completeAllTasks = completeValue;
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
            message: hit._source.sask,
            index: hit._id,
            complete: hit._source.complete
          };
        });
      } catch (error) {
        this.toasted('error',`${error.message}`);
      }
    },

    async setCurrentList(collection) {
      if (this.currentRoomId !== '') {
        await kuzzle.realtime.unsubscribe(this.currentRoomId);
      }
      if (collection.value === '') {
        this.tasks = [];
        this.updateDisplay();
        return;
      }
      try {
        this.currentList = { text: collection.text, value: collection.value };
        await this.fetchIndex();
        await this.fetchCollection();
        await this.subscribeDoc();
      } catch (error) {
        this.toasted('error',`${error.message}`);
      }
      this.updateDisplay();
    },

    async fetchIndex() {
      this.lists = [];
      try {
        const collectionList = await kuzzle.collection.list(this.indexName);
        this.lists = collectionList.collections.map(elem => ({text: elem.name, value: elem.name}));
      } catch (error) {
        this.toasted('error',`${error.message}`);
      }
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
        const message = { title: 'New Collection', name: input };
        await kuzzle.realtime.publish('NewCollectionRoom', 'NCR', message);
      } catch (error) {
        this.toasted('error',`${error.message}`);
      }
    },
    ClearStore() {
      localStorage.removeItem('connected2kuzzle');
    }
  },
  async mounted() {
    window.addEventListener('beforeunload', this.ClearStore);
    const callback = notification => {
      if (
        notification.action === 'publish' &&
        notification.collection === 'NCR'
      ) {
        this.toasted('info', `New List ${notification.result._source.name} created!`);
        this.fetchIndex();
      }
    };
    try {
      await this.fetchIndex();
      this.currentList.text = this.lists[0].text;
      this.currentList.value = this.lists[0].value;
      await this.fetchCollection();
      this.updateDisplay();
      await this.subscribeDoc();
      await kuzzle.realtime.subscribe('NewCollectionRoom', 'NCR', {}, callback);
    } catch (error) {
      this.toasted('error',`${error.message}`);
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
