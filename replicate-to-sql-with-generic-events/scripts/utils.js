async function createIndexIfNotExists(kuzzle, index = '') {
  try {
    const exists = await kuzzle.index.exists(index);

    if (!exists) {
      await kuzzle.index.create(index);
    }
  }
  catch (error) {
    throw error;
  }
}

async function createCollectionIfNotExists(kuzzle, index = '', collection = '') {
  try {
    const exists = await kuzzle.collection.exists(index, collection);

    if (!exists) {
      await kuzzle.collection.create(index, collection);
    }
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  createIndexIfNotExists,
  createCollectionIfNotExists
};
