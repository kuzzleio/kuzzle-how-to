const { Client } = require('pg');

class PostgresWrapper {
  createClient() {
    const client = new Client({
      user: 'my_user',
      host: 'postgresql',
      database: 'postgres',
      password: 'password',
      port: 5432
    });

    this.client = client;
  }

  connect() {
    this.createClient();
    this.client.connect();
  }

  end() {
    this.client.end();
    this.client = undefined;
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
      this.connect();
      const query = `INSERT INTO yellow_taxi (${params}) VALUES(${indexes})`;
      this.client
        .query(query, values)
        .then(resolve)
        .catch(reject)
        .finally(() => this.end());
    });
  }

  delete(docId) {
    return new Promise((resolve, reject) => {
      this.connect();
      const query = `DELETE FROM yellow_taxi WHERE yellow_taxi._id='${docId}'`;
      this.client
        .query(query)
        .then(resolve)
        .catch(reject)
        .finally(() => this.end());
    });
  }
}

module.exports = {
  PostgresWrapper
};
