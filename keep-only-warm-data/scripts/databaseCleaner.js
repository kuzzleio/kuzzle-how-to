'use strict';

const
  ElasticSearch = require('elasticsearch'),
  program = require('commander'),
  ms = require('ms');

program
  .option('-h, --host <s>', 'Elastic host', 'elasticsearch')
  .option('-p, --port <n>', 'Elastic port', 9200)
  .option('-i, --index <s>', 'Index name')
  .option('-c, --collection <s>', 'Collection name')
  .option('-r, --retention <s>', 'Retention time specified in days (d), hours (h) or minutes (m)', '30d')
  .option('--confirm', 'Confirm deletion')
  .parse(process.argv);

if (! program.index) {
  console.error('No index provided');
  process.exit(1);
}

if (! program.collection) {
  console.error('No collection provided');
  process.exit(1);
}

const retentionTime = ms(program.retention);
if (retentionTime <= 0) {
  console.error(`Invalid retention time '${program.retention}'`);
  process.exit(1);
}

const retentionTimestamp = Date.now() - retentionTime;
const query = {
  index: program.index,
  type: program.collection,
  body: {
    query: {
      bool: {
        filter: [
          {
            range: {
              '_kuzzle_info.createdAt': {
                lte: retentionTimestamp
              }
            }
          },
          {
            term: {
              '_kuzzle_info.active': true
            }
          }
        ]
      }
    }
  }
};

const elasticsearchClient = new ElasticSearch.Client({
  host: `${program.host}:${program.port}`
});


if (program.confirm) {
  elasticsearchClient
    .deleteByQuery(query)
    .then(response => {
      console.log(`Delete ${response.deleted} documents created before ${new Date(retentionTimestamp)}`);
      process.exit(0);
    }, error => {
      console.log(`Error retrieving documents : ${error.message}`);
      process.exit(1);
    });
} else {
  elasticsearchClient
    .search(query)
    .then(response => {
      console.log(`Match ${response.hits.total} documents since ${new Date(retentionTimestamp)}`);
      console.log('Run with --confirm to delete documents');
      process.exit(0);
    }, error => {
      console.log(`Error retrieving documents : ${error.message}`);
      process.exit(1);
    });
}
