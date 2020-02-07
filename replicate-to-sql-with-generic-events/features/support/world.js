const
  { setWorldConstructor } = require('cucumber');

class KWorld {
  constructor () {
    this.host = process.env.KUZZLE_HOST || 'localhost';
    this.port = process.env.KUZZLE_PORT || '7512';
  }
}

setWorldConstructor(KWorld);

module.exports = KWorld;
