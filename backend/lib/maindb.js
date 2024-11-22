'use strict';
const { Pool } = require('pg');
var envconfig = require.main.require('./envconfig.js').vars;

const pool = new Pool({
  connectionString: envconfig.PG.Admin
});
// console.log(pool)
// pool.query('SELECT NOW()', (err, res) => {
//     console.log(err, res)
//     // pool.end()
// })
// function que .
 
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
// exports.query = pool.query;