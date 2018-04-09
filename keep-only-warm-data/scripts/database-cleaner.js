'use strict';

const oneMinute = 60 * 1000;
const oneHour = 60 * oneMinute;
const oneDay = 24 * oneHour;

const
  ElasticSearch = require('elasticsearch'),
  program = require('commander');

function parseDuration (durationString) {
  const duration = (durationString.match(/\d+/) || []).map(Number)[0];
  const unit = (durationString.toLowerCase().match(/[a-z]+/) || [])[0];

  if (! duration || ! unit) {
    return -1;
  }

  switch (unit) {
    case 'd':
    case 'day':
    case 'days':
      return duration * oneDay;
    case 'h':
    case 'hour':
    case 'hours':
      return duration * oneHour;
    case 'm':
    case 'minute':
    case 'minutes':
    case 'min':
      return duration * oneMinute;
    default:
      return -1;
  }
}

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

const retentionTime = parseDuration(program.retention);
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
        filter: {
          range: {
            '_kuzzle_info.createdAt': {
              lte: retentionTimestamp
            }
          }
        },
        filter: {
          term: {
            '_kuzzle_info.active': true
          }
        }
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
