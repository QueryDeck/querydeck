'use strict';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.QD_DB_URL
});
 
function query(q, callback){
  // console.log('MAIND', q)
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
