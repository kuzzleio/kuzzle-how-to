<template>
  <div id="Home">
    <NavBar></NavBar>
    <v-container fluid grid-list-xl text-xs-center>
      <ManageList
        :Lists="Lists"
        :CurrentList="CurrentList"
        @SetCurrentList="SetCurrentList"
        @CreateList="CreateList"
      />
      <Add class="row col s8" @AddTask="AddTask"/>
      <MenuCollection
        class="row"
        @DeleteSelectedTasks="DeleteSelectedTasks"
        @SetSelectedTasksComplete="SetSelectedTasksComplete"
        :CompleteAllTasks="this.CompleteAllTasks"
        :TaskLength="this.Tasks.length"
        @SetSeeActiveTasks="SetSeeActiveTasks"
        @SetSeeCompletedTasks="SetSeeCompletedTasks"
      />
      <v-list one-line>
        <template v-for="Task in this.Tasks">
          <Task
            :key="Task.Index"
            v-if="Task.Displayed === true"
            :Complete="Task.Complete"
            :Index="Task.Index"
            :Message="Task.Message"
            @DeleteTask="DeleteTask"
            @SetTaskComplete="SetTaskComplete"
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
      Lists: [{ text: 'NameOfTheList', value: 'NameOfTheList' }],
      Tasks: [
        {
          Message: 'MessageOfTheTask',
          Index: 0,
          Complete: false,
          Displayed: true
        }
      ],
      CompleteAllTasks: false,
      SeeActiveTasks: true,
      SeeCompletedTasks: true,
      CurrentList: { text: 'build', value: 'build' },
      CurrentRoomId: '',
      IndexName: localStorage.getItem('IndexName'),
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
    Toasted(Type, Message) {
      if (localStorage.getItem('ToastsEnabled') === 'false') {
        return;
      }
      switch (Type) {
        case 'info':
          this.$toast.info(Message, 'INFO', this.info);
          break;
        case 'error':
          this.$toast.error(Message, 'ERROR', this.error);
          break;
        case 'success':
          this.$toast.success(Message, 'SUCCESS', this.success);
          break;
      }
    },

    UpdateDisplay() {
      this.Tasks.forEach(elem => {
        elem.Displayed = false;
        if ((elem.Complete && this.SeeCompletedTasks) || (!elem.Complete && this.SeeActiveTasks)) {
          elem.Displayed = true;
        }
      });
      this.UpdateCompleteAll();
    },

    SetSeeActiveTasks(SeeActiveValue) {
      this.SeeActiveTasks = SeeActiveValue;
      this.UpdateDisplay();
    },

    SetSeeCompletedTasks(SeeCompletedValue) {
      this.SeeCompletedTasks = SeeCompletedValue;
      this.UpdateDisplay();
    },

    async AddTask(Message) {
      if (!this.SeeActiveTasks) {
        this.SetSeeActiveTasks();
      }
      if (Message === '') {
        this.Toasted('error','Cannot add empty todo!');
        return;
      }
      try {
        const Result = await kuzzle.document.create(this.IndexName, this.CurrentList.value, {
          Task: Message,
          Complete: false
        });
        this.Tasks.push({
          Message: Message,
          Index: Result._id,
          Complete: false,
          Displayed: true
        });
        this.Toasted('info',`New task ${Message}`);
      } catch (error) {
        this.Toasted('error',`${error.message}`);
      }
      this.UpdateDisplay();
    },

    async DeleteTask(Index) {
      try {
        await kuzzle.document.delete(this.IndexName, this.CurrentList.value, Index);
        this.Tasks = this.Tasks.filter(task => {
          return task.Index !== Index;
        });
        this.Toasted('info',`Task ${Index} deleted`);
      } catch (error) {
        this.Toasted('error',`${error.message}`);
      }
      this.UpdateDisplay();
    },

    async SetTaskComplete(Index, NewValue) {
      try {
        await kuzzle.document.update(this.IndexName, this.CurrentList.value, Index, {
          Complete: NewValue
        });
        const UpdatedTask = this.Tasks.find(task => task.Index === Index);
        UpdatedTask.Complete = NewValue;
        this.Toasted('info',`Task ${UpdatedTask.Task} updated`);
      } catch (error) {
        this.Toasted('error',`${error.message}`);
      }
      this.UpdateDisplay();
    },

    async DeleteSelectedTasks() {
      let Deleted = false;

      this.Tasks.forEach(elem => {
        if (elem.Complete === true) {
          Deleted = true;
          this.DeleteTask(elem.Index);
        }
      });

      if (Deleted === false) {
        this.Toasted('error','No task completed!');
        return;
      }
      this.UpdateDisplay();
    },

    async SetSelectedTasksComplete(NewValue) {
      if (this.Tasks.length === 0) {
        this.Toasted('error','Nothing to complete');
        this.CompleteAllTasks = false;
        return;
      }
      this.CompleteAllTasks = NewValue;
      this.Tasks.forEach(async elem => {
        if (elem.Displayed) {
          if (elem.Complete !== this.CompleteAllTasks) {
            this.SetTaskComplete(elem.Index, NewValue);
          }
        }
      });
      this.UpdateDisplay();
    },

    UpdateCompleteAll() {
      let CompleteValue = true;
      this.Tasks.some(elem => {
        if (elem.Displayed && !elem.Complete) {
          CompleteValue = false;
          return false;
        }
      });
      if (CompleteValue !== this.CompleteAllTasks) {
        this.CompleteAllTasks = CompleteValue;
      }
    },

    async FetchCollection() {
      this.Tasks = [];
      let Results = {};
      try {
        Results = await kuzzle.document.search(
          this.IndexName,
          this.CurrentList.value,
          { sort: ['_kuzzle_info.createdAt'] },
          { size: 100 }
        );
        this.Tasks = Results.hits.map(hit => {
          return {
            Message: hit._source.Task,
            Index: hit._id,
            Complete: hit._source.Complete
          };
        });
      } catch (error) {
        this.Toasted('error',`${error.message}`);
      }
    },

    async SetCurrentList(Collection) {
      if (Collection.value === '') {
        this.Tasks = [];
        this.UpdateDisplay();
        return;
      }
      try {
        this.CurrentList = { text: Collection.text, value: Collection.value };
        await this.FetchIndex();
        await this.FetchCollection();
      } catch (error) {
        this.Toasted('error',`${error.message}`);
      }
      this.UpdateDisplay();
    },

    async FetchIndex() {
      this.Lists = [];
      try {
        const collectionList = await kuzzle.collection.list(this.IndexName);
        collectionList.collections.forEach(elem => {
          this.Lists.push({ text: elem.name, value: elem.name });
        });
      } catch (error) {
        this.Toasted('error',`${error.message}`);
      }
    },

    async CreateList(Input) {
      const Mapping = {
        properties: {
          Complete: { type: 'boolean' },
          Task: { type: 'text' }
        }
      };
      try {
        await kuzzle.collection.create(this.IndexName, Input, Mapping);
        this.SetCurrentList({ text: Input, value: Input });
        const Message = { title: 'New Collection', name: Input };
        await kuzzle.realtime.publish('NewCollectionRoom', 'NCR', Message);
        this.FetchIndex();
      } catch (error) {
        this.Toasted('error',`${error.message}`);
      }
    },

    ClearStore() {
      localStorage.removeItem('connected2kuzzle');
    }
  },
  async mounted() {
    window.addEventListener('beforeunload', this.ClearStore);
    try {
      await this.FetchIndex();
      this.CurrentList.text = this.Lists[0].text;
      this.CurrentList.value = this.Lists[0].value;
      await this.FetchCollection();
      this.UpdateDisplay();
    } catch (error) {
      this.Toasted('error',`${error.message}`);
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
