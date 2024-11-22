'use strict';

const db = require.main.require('./lib/maindb.js');
const databaseUrl = require.main.require('./envconfig.js').vars.PG.Admin;
const ErrorHandler = require.main.require('./lib/errors.js');
const envconfig = require.main.require('./envconfig.js').vars;
const builder = require('./builder.js');

module.exports = class Database {

  constructor(app){
    if(!app) throw 'no app';
    this.app = app.subdomain ? app : {subdomain: 'pgtavern', livedb: envconfig.PG.Admin, testdb: envconfig.PG.Admin};
    this.allmodels = require.main.require('./models/modelManager.js').pgtmodels;
    return this;
  }

  live(){
    this.execlive = true;
  }

  execute(models, callback){
    let narr = [], l;
    if(!Array.isArray(models)) models = [models];
    l = models.length;
    for (let i = 0; i < l; i++) {
      if(models[i].model) narr.push(models[i].authenticate({}));
      else narr.push(models[i]);
    }

    let q = new builder(narr, this.allmodels).generate();

    return this.PGSafe(q, function(err, result){
      if(err) return callback(err);
      if(!result.rows || result.rows.length == 0) return callback(null, {});
      let r = {oldrows: {}, newrows: {}, deletedrows: {}};
      let k = Object.keys(result.rows[0]);
      for (let i = 0; i < k.length; i++) {
        // console.log(k[i], k.indexOf('old$'), k.indexOf('new$'));
        if(k[i].indexOf('old$') > -1) {
          let name = k[i].split('$')[1];
          r.oldrows[name] = r.oldrows[name] || [];
          r.newrows[name] = r.newrows[name] || [];
          r.oldrows[name] = r.oldrows[name].concat(result.rows[0][k[i]]);
        } else if(k[i].indexOf('new$') > -1) {
          let name = k[i].split('$')[1];
          r.oldrows[name] = r.oldrows[name] || [];
          r.newrows[name] = r.newrows[name] || [];
          r.newrows[name] = r.newrows[name].concat(result.rows[0][k[i]]);
        } else if(k[i].indexOf('deleted$') > -1) {
          let name = k[i].split('$')[1];
          r.deletedrows[name] = r.deletedrows[name] || [];
          r.deletedrows[name] = r.deletedrows[name].concat(result.rows[0][k[i]]);
        } else {
          r[k[i]] = result.rows[0][k[i]];
        }
      }
      return callback(null, r);
    });
  }

  executeRaw(query, callback){
    if(process.env.COMPUTER_PASS){
      console.log('RAW QUERY', query);
    }
    return db.query(query, callback);
  }

  PGSafe(query, callback){
    // console.log("-->query");
    // console.log(query);
    // return   console.log("-------> return `")  ; 
    let url = this.execlive ? this.app.livedb : this.app.testdb;
    db.query(query, callback);
    // pg.connect(url, function(err, client, done){
    //   if(err) return callback(err);
    //   client.query(query, function(err, result){
    //     done();
    //     callback(err, result);
    //   });
    // });
  }

};
