import Vue from 'vue';

const state = {
  tasks: {},
  roomId: null
};

const actions = {
  CREATE_TASK: async ({ commit, rootState }, { kuzzle, message }) => {
    const currentList = rootState.lists.currentList;
    const groupList = rootState.lists.groupList;
    const task = {
      task: message,
      complete: false
    };
    const response = await kuzzle.document.create(groupList, currentList, task);
    commit('ADD_TASK', { _id: response._id, _source: task });
    commit(
      'app/SET_NOTIFICATION',
      {
        type: 'success',
        action: 'create',
        id: response._id
      },
      { root: true }
    );
  },

  DELETE_TASK: async ({ rootState, commit }, { kuzzle, taskId }) => {
    const currentList = rootState.lists.currentList;
    const groupList = rootState.lists.groupList;
    await kuzzle.document.delete(groupList, currentList, taskId);
    commit('DELETE_TASK', { _id: taskId });
    commit(
      'app/SET_NOTIFICATION',
      {
        type: 'success',
        action: 'delete',
        id: taskId
      },
      { root: true }
    );
  },

  DELETE_COMPLETED_TASKS: async ({ dispatch }, { kuzzle }) => {
    for (let taskId in state.tasks) {
      if (state.tasks[taskId].complete) {
        await dispatch('DELETE_TASK', { kuzzle, taskId });
      }
    }
  },

  SET_ALL_TASKS_COMPLETE: async ({ dispatch }, { kuzzle }) => {
    for (let taskId in state.tasks) {
      if (!state.tasks[taskId].complete) {
        await dispatch('SET_TASK_COMPLETE', { kuzzle, taskId });
      }
    }
  },

  UNSET_ALL_TASKS_COMPLETE: async ({ dispatch }, { kuzzle }) => {
    for (let taskId in state.tasks) {
      if (state.tasks[taskId].complete) {
        await dispatch('UNSET_TASK_COMPLETE', { kuzzle, taskId });
      }
    }
  },

  SET_TASK_COMPLETE: async ({ commit, rootState }, { kuzzle, taskId }) => {
    const currentList = rootState.lists.currentList;
    const groupList = rootState.lists.groupList;
    const task = state.tasks[taskId];
    task.complete = true;
    await kuzzle.document.update(groupList, currentList, taskId, task);
    commit('UPDATE_TASK', { _id: taskId, _source: task });
    commit(
      'app/SET_NOTIFICATION',
      {
        type: 'success',
        action: 'complete',
        id: taskId
      },
      { root: true }
    );
  },

  UNSET_TASK_COMPLETE: async ({ commit, rootState }, { kuzzle, taskId }) => {
    const currentList = rootState.lists.currentList;
    const groupList = rootState.lists.groupList;
    const task = state.tasks[taskId];
    task.complete = false;
    await kuzzle.document.update(groupList, currentList, taskId, task);
    commit('UPDATE_TASK', { _id: taskId, _source: task });
    commit(
      'app/SET_NOTIFICATION',
      {
        type: 'success',
        action: 'uncomplete',
        id: taskId
      },
      { root: true }
    );
  },

  SUBSCRIBE_TASKS: async ({ commit, rootState }, { kuzzle }) => {
    const currentList = rootState.lists.currentList;
    const groupList = rootState.lists.groupList;
    const callback = notification => {
      if (notification.type === 'document') {
        switch (notification.action) {
          case 'create':
            commit('ADD_TASK', notification.result);
            break;
          case 'update':
            commit('UPDATE_TASK', notification.result);
            break;
          case 'delete':
            commit('DELETE_TASK', notification.result);
            break;
        }
      }
      let action = notification.action;
      if (action === 'update') {
        action = notification.result._source.complete
          ? 'complete'
          : 'uncomplete';
      }
      commit(
        'app/SET_NOTIFICATION',
        {
          type: 'info',
          action: action,
          id: notification.result._id
        },
        { root: true }
      );
    };
    const filter = {};
    const roomId = await kuzzle.realtime.subscribe(
      groupList,
      currentList,
      filter,
      callback,
      { subscribeToSelf: false }
    );
    commit('SET_ROOM_ID', roomId);
  },

  UNSUBSCRIBE_TASKS: async ({ commit }, { kuzzle }) => {
    if (state.roomId) {
      await kuzzle.realtime.unsubscribe(state.roomId);
      commit('SET_ROOM_ID', null);
    }
  },

  FETCH_TASKS: async ({ commit, rootState, dispatch }, { kuzzle }) => {
    commit('RESET_TASKS');
    const currentList = rootState.lists.currentList;
    const groupList = rootState.lists.groupList;
    const results = await kuzzle.document.search(
      groupList,
      currentList,
      { sort: ['_kuzzle_info.createdAt'] },
      { size: 100 }
    );
    results.hits.forEach(hit => {
      commit('ADD_TASK', hit);
    });
    await dispatch('SUBSCRIBE_TASKS', { kuzzle });
  }
};

const mutations = {
  SET_ROOM_ID: (state, room) => {
    state.roomId = room;
  },
  RESET_TASKS: state => {
    state.tasks = {};
  },
  ADD_TASK: (state, task) => {
    Vue.set(state.tasks, task._id, task._source);
  },
  UPDATE_TASK: (state, task) => {
    Vue.set(state.tasks, task._id, task._source);
  },
  DELETE_TASK: (state, task) => {
    Vue.delete(state.tasks, task._id);
  }
};

const getters = {
  GET_TASKS: state => {
    return (seeActiveTasks, seeCompletedTasks) => {
      let tmp = [];
      for (let task in state.tasks) {
        const document = state.tasks[task];
        if (
          (document && document.complete && seeCompletedTasks) ||
          (!document.complete && seeActiveTasks)
        ) {
          tmp.push({
            message: state.tasks[task].task,
            complete: state.tasks[task].complete,
            index: task
          });
        }
      }
      return tmp;
    };
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
