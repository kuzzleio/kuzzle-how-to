async function createIndexIfNotExists(kuzzle, index = '') {
  const exists = await kuzzle.index.exists(index);

  if (!exists) {
    await kuzzle.index.create(index);
  }
}

async function createCollectionIfNotExists(kuzzle, index = '', collection = '') {
  const exists = await kuzzle.collection.exists(index, collection);

  if (!exists) {
    await kuzzle.collection.create(index, collection);
  }
}

module.exports = {
  createIndexIfNotExists,
  createCollectionIfNotExists
};
