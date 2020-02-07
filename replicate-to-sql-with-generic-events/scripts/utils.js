async function createIndexIfNotExists(kuzzle, index = '') {
  try {
    const exists = await kuzzle.index.exists(index);

    if (!exists) {
      await kuzzle.index.create(index);
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function createCollectionIfNotExists(kuzzle, index = '', collection = '') {
  try {
    const exists = await kuzzle.collection.exists(index, collection);

    if (!exists) {
      await kuzzle.collection.create(index, collection);
    }
  } catch (error) {
    console.error(error.message);
  }
}

module.exports = {
  createIndexIfNotExists,
  createCollectionIfNotExists
};
