'use strict';
const { Pool } = require('pg');
var envconfig = require.main.require('./envconfig.js').vars;

const pool = new Pool({
  connectionString: envconfig.PG.Admin,
  ssl: {
    rejectUnauthorized: false,
  },
});
 
function query(q, callback){
  pool.connect((err, client, done) => {
    if (err) {
      done();
      return callback(err);
    }
    client.query(q, (err, res) => {
      done();
      callback(err, res);
    });
  });
}

exports.query = query;
