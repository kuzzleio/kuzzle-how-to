const { Client } = require('pg');

class PostgresWrapper {
  constructor(config) {
    this.config = config;
    this.createClient(this.config);
  }

  createClient(config) {
    const client = new Client(config);
    this.client = client;
  }

  connect() {
    this.client.connect();
  }

  end() {
    this.client.end();
  }

  formatIndex(values) {
    return values
      .reduce((prev, cur, index) => {
        prev.push(`$${index + 1}`);
        return prev;
      }, [])
      .join(',');
  }

  insert(data) {
    return new Promise((resolve, reject) => {
      const params = Object.keys(data).join(',');
      const values = Object.values(data);
      const indexes = this.formatIndex(values);
      const query = `INSERT INTO yellow_taxi (${params}) VALUES(${indexes})`;
      this.client
        .query(query, values)
        .then(resolve)
        .catch(reject);
    });
  }

  delete(docId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM yellow_taxi WHERE yellow_taxi._id='${docId}'`;
      this.client
        .query(query)
        .then(resolve)
        .catch(reject);
    });
  }
  countData() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) FROM yellow_taxi';
      this.client
        .query(query)
        .then(resolve)
        .catch(reject);
    });
  }
}

module.exports = {
  PostgresWrapper
};
