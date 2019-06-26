const state = {
  groupList: '',
  lists: [],
  currentList: '',
  roomId: null
};

const actions = {
  CREATE_GROUP_LIST: async (
    { commit, dispatch },
    { kuzzle, groupListName }
  ) => {
    commit('SET_GROUP_LIST', groupListName);
    if (!(await kuzzle.index.exists(groupListName))) {
      await kuzzle.index.create(groupListName);
      await dispatch('CREATE_LIST', { kuzzle, listName: 'FirstList' });
    }
  },

  CREATE_LIST: async ({ commit, dispatch }, { kuzzle, listName }) => {
    const mapping = {
      properties: {
        complete: { type: 'boolean' },
        task: { type: 'text' }
      }
    };
    if (await kuzzle.collection.exists(state.groupList, listName)) return;
    await kuzzle.collection.create(state.groupList, listName, mapping);
    const message = {
      type: 'create',
      listName: listName
    };
    await kuzzle.realtime.publish(
      'volatileIndex',
      'volatileCollection',
      message
    );
    await dispatch('SET_CURRENT_LIST', { kuzzle, listName });
    commit('ADD_LIST', listName);
    commit(
      'app/SET_NOTIFICATION',
      {
        type: 'success',
        action: 'create list',
        id: listName
      },
      { root: true }
    );
  },

  SET_CURRENT_LIST: async ({ commit, dispatch }, { kuzzle, listName }) => {
    await dispatch('tasks/UNSUBSCRIBE_TASKS', { kuzzle }, { root: true });
    commit('SET_CURRENT_LIST', listName);
    await dispatch('tasks/FETCH_TASKS', { kuzzle }, { root: true });
  },

  FETCH_LISTS: async ({ commit, dispatch }, { kuzzle }) => {
    commit('RESET_LISTS');
    const { collections } = await kuzzle.collection.list(state.groupList);
    lists.collections.forEach(list => {
      commit('ADD_LIST', list.name);
    });
    const listName = state.lists[0];
    await dispatch('SET_CURRENT_LIST', { kuzzle, listName });
    await dispatch('SUBSCRIBE_LIST', { kuzzle });
  },

  SUBSCRIBE_LIST: async ({ commit }, { kuzzle }) => {
    const callback = notification => {
      if (
        notification.action === 'publish' &&
        notification.result._source.type === 'create'
      ) {
        commit('ADD_LIST', notification.result._source.listName);
        commit(
          'app/SET_NOTIFICATION',
          {
            type: 'info',
            action: 'create list',
            id: notification.result._source.listName
          },
          { root: true }
        );
      }
    };
    const filter = {};
    state.roomId = await kuzzle.realtime.subscribe(
      'volatileIndex',
      'volatileCollection',
      filter,
      callback,
      { subscribeToSelf: false }
    );
  }
};

const mutations = {
  RESET_LISTS: state => {
    state.lists = [];
  },
  ADD_LIST: (state, list) => {
    state.lists.push(list);
  },
  SET_CURRENT_LIST: (state, listName) => {
    state.currentList = listName;
  },
  SET_GROUP_LIST: (state, groupListName) => {
    state.groupList = groupListName;
  }
};

const getters = {
  GET_CURRENT_LIST: state => ({
    value: state.currentList,
    text: state.currentList
  }),
  GET_LISTS: state => state.lists.map(elem => ({ text: elem, value: elem }))
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
