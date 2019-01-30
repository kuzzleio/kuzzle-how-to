<template>
  <div id="Home">
    <Add class="row col s8" v-on:addTask="addTask"/>
    <MenuCollection
      class="row"
      @deleteSelected="deleteSelected"
      @updateSelected="updateSelected"
      :completedAll="this.completedAll"
      :taskLength="this.tasks.length"
      :seeActive="this.seeActive"
      :seeCompleted="this.seeCompleted"
      @updateActive="updateActive"
      @updateCompleted="updateCompleted"
    />
    <ul>
      <li v-for="task in this.tasks" :key="task.index">
        <Task
          :complete="task.complete"
          :index="task.index"
          :message="task.message"
          v-on:deleteTask="deleteTask"
          v-on:updateTask="updateTask"
        ></Task>
      </li>
    </ul>
  </div>
</template>

<script>
import MenuCollection from '../components/menucollection.vue';
import Add from '../components/add.vue';
import kuzzle from '../../service/kuzzle';
import Task from '../components/task';
export default {
  name: 'Home',
  components: {
    Add,
    MenuCollection,
    Task
  },
  data() {
    return {
      tasks: [{ message: 'build', index: 0, complete: false }],
      completedAll: false,
      seeActive: true,
      seeCompleted: true,
      success: {
        position: 'bottomRight'
      },
      error: {
        position: 'topRight'
      }
    };
  },
  methods: {
    async see() {
      this.tasks = [];
      let results = {};
      try {
        if (this.seeCompleted && this.seeActive) {
          results = await kuzzle.document.search(
            'todo',
            'tasks',
            { sort: ['_kuzzle_info.createdAt'] },
            { size: 100 }
          );
        } else if (this.seeCompleted) {
          results = await kuzzle.document.search(
            'todo',
            'tasks',
            {
              query: {
                match: {
                  complete: true
                }
              }
            },
            { sort: ['_kuzzle_info.createdAt'] },
            { size: 100 }
          );
        } else if (this.seeActive) {
          results = await kuzzle.document.search(
            'todo',
            'tasks',
            {
              query: {
                match: {
                  complete: false
                }
              }
            },
            { sort: ['_kuzzle_info.createdAt'] },
            { size: 100 }
          );
        } else {
          this.updateCompleteAll();
          return;
        }
        this.tasks = results.hits.map(hit => {
          return {
            message: hit._source.task,
            index: hit._id,
            complete: hit._source.complete
          };
        });
      } catch (error) {
        this.$toast.error(`${error.message}`, 'ERROR', this.error);
      }
      this.updateCompleteAll();
    },

    updateActive() {
      this.seeActive = !this.seeActive;
      this.see();
    },

    updateCompleted() {
      this.seeCompleted = !this.seeCompleted;
      this.see();
    },

    async addTask(message) {
      if (!this.seeActive) {
        this.updateActive();
      }
      if (message === '') {
        this.$toast.error('Cannot add empty todo!', 'ERROR', this.error);
        return;
      }
      try {
        const doc = await kuzzle.document.create('todo', 'tasks', {
          task: message,
          complete: false
        });
        this.tasks.push({ message: message, index: doc._id, complete: false });
      } catch (error) {
        this.$toast.error(`${error.message}`, 'ERROR', this.error);
      }
      this.updateCompleteAll();
      this.$toast.success('Task successfully created!', 'SUCCESS', this.success);
    },

    async deleteTask(index) {
      try {
        await kuzzle.document.delete('todo', 'tasks', index);
        this.tasks = this.tasks.filter(task => {
          return task.index !== index;
        });
      } catch (error) {
        this.$toast.error(`${error.message}`, 'ERROR', this.error);
      }
      this.updateCompleteAll();
      this.$toast.success('Task successfully deleted!', 'SUCCESS', this.success);
    },

    async updateTask(index) {
      try {
        let complete = !this.tasks.find(task => task.index === index).complete;
        await kuzzle.document.update('todo', 'tasks', index, {
          complete: complete
        });
        this.tasks.find(task => task.index === index).complete = complete;
      } catch (error) {
        this.$toast.error(`${error.message}`, 'ERROR', this.error);
      }
      this.updateCompleteAll();
    },

    async deleteSelected() {
      let deleted = false;

      this.tasks.forEach(elem => {
        if (elem.complete === true) {
          deleted = true;
          this.deleteTask(elem.index);
        }
      });

      if (deleted === false) {
        this.$toast.error('No task completed!', 'ERROR', this.error);
        return;
      }
      this.$toast.success('Tasks successfully cleared!', 'SUCCESS', this.success);
      this.items = this.items.filter(item => item.complete === false);
      this.updateCompleteAll();
    },

    async updateSelected() {
      if (this.tasks.length === 0) {
        this.$toast.error('Nothing to complete', 'ERROR', this.error);
        this.completedAll = false;
        return;
      }
      this.completedAll = !this.completedAll;
      this.tasks.forEach(async elem => {
        if (elem.complete !== this.completedAll) {
          this.updateTask(elem.index);
        }
      });
    },

    updateCompleteAll() {
      this.completedAll = this.tasks.length > 0;
      this.tasks.some(elem => {
        if (!elem.complete) {
          this.completedAll = false;
          return false;
        }
      });
    }
  },
  created() {
    this.see();
  }
};
</script>

<style scoped>
#Home {
  width: 1024px;
  background-color: #ffffff;
  border: 1px solid #cccccc;
  padding: 20px;
  margin: auto;
  margin-top: 10px;
}
</style>
