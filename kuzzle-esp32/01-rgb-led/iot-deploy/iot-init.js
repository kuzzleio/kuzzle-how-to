/* eslint-disable no-console */

const 
  Kuzzle = require('kuzzle-sdk').Kuzzle,
  Bluebird = require('bluebird'),
  fs = Bluebird.promisifyAll(require('fs')),
  Enquirer = require('enquirer'),
  enquirer = new Enquirer();

enquirer.register('list', require('prompt-list'));
enquirer.register('password', require('prompt-password'));

const IOT_COLLECTIONS = ['fw-updates', 'device-state', 'device-info'];

let kuzzle;

async function get_configs() {
  return fs.readdirAsync('config')
    .then(r => {
      if (r.lenght === 0) {
        throw new Error('You first need to create a configuration in ./config. See config.default.json for config example');
      }
      return r;
    });


async function create_collections(index) {
  const promises = [];
  const res = await kuzzle.collection.list(index);

  IOT_COLLECTIONS.forEach(col_name => {
    if (!res.collections.find(elem => elem.name === col_name)) {
      const mapping = require(`./mappings/${col_name}`);
      promises.push(
        kuzzle.collection.create(index, col_name, mapping)
          .then(() => {
            console.log(`[${col_name}] Collection created`);
          })
          .catch((err) => {
            console.log('Failed to create collection: \n', err);
            throw (err);
          })
      );
    } else {
      console.log(`[${col_name}] Collection already exists`);
    }
  });
  return Promise.all(promises);
}

async function create_index(index) {
  return kuzzle.index.create(index)
    .then(() => console.log(`Index '${index}' created...`))
    .catch(() => console.log(`Index '${index}' already exists`)); // Not rethrowing on purpose as we want to continue if the index already exists
}

async function choose_config() {
  return get_configs()
    .then(configs => {
      const config_question = [{
        name: 'config',
        message: 'Which configuration: ',
        type: 'list',
        choices: configs
      }];
      return enquirer.ask(config_question);
    })
    .then(resp => {
      const config = require('./config/' + resp.config);
      return config.kuzzle;
    });
}

async function run() {
  const kuzzle_cfg = await choose_config();
  kuzzle = new Kuzzle('websocket', {
    host: kuzzle_cfg.host,
    port: kuzzle_cfg.port
  });
  await kuzzle.connect()
    .catch(e => {
      console.log('Connection error: ', e.message);
      process.exit(-1);
    });

  if (kuzzle.user) {
    await kuzzle.auth.login('local', kuzzle_cfg.user, '1d')
      .catch(e => {
        console.log('Login with config password error: ', e.message);
        const config_question = [{
          name: 'password',
          message: 'Password: ',
          type: 'password',
        }];

        return enquirer.ask(config_question)
          .then(r => {
            return kuzzle.auth.login('local', {
              username: kuzzle_cfg.user,
              password: r.password
            },
            '1d');
          });
      })
      .catch((e) => {
        console.log('Login error: ', e.message);
        process.exit(-1);
      });
  }
  await create_index(kuzzle_cfg.index);
  await create_collections(kuzzle_cfg.index);
  kuzzle.disconnect();
  console.log('[DONE] Your IoT environement is ready to use...');
}

run();
