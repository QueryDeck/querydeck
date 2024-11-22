'use strict';
// var pg = require('pg');
// var envconfig = require.main.require('./envconfig.js').vars;
// var alldefs = require.main.require('./envconfig.js');
var ModelManager = require('./models/modelManager.js');
// var db = require.main.require('./lib/maindb.js');
// var asyncloop = require.main.require('./lib/asyncloop.js').asyncloop;
// var cipher = new (require("./lib/cipher.js")) (envconfig.cipher.secret , envconfig.cipher.algorithm );
var updateCovidDaily = require('./extras/updateCovidDaily');

var methods = [function (callback){

  // var dbs = [  
  //   // {name: 'pgtavern', url: envconfig.PG.Admin}
  // ];
  // console.log(db.query)

  // ######  load project model ######  
  //
  ModelManager.loadMain(function(err){ 
    if(err) return callback(err);
    console.log(" -----> Main model loaded");
    // if(process.env.PROJECT_ENV !== 'prod') return callback(err); //  prevent   loading  client model while  devlopment

    // ModelManager.loadClientModels(function(err){ 
    //   console.log(" -----> clients  model loaded");
    //   callback(err); 
    //     // ###  start timer for Syncing  Clients models ###
    //     reSyncSchema(); 
    //     updateCovidDaily.startTimer(); 

    // });

    callback()
 
  });



}];

module.exports = function(finalCallback){
  var c = 0;
  recur();
  function recur(){
    if(c == methods.length) return finalCallback();
    methods[c](function(err){
      if(err) return finalCallback(err);
      ++c;
      recur();
    });
  }
};

Object.defineProperty(global, '__stack', {
  get: function(){
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});

Object.defineProperty(global, '__lineNumber', {
  get: function(){
    return __stack[1].getLineNumber();
  }
});
// console.log( __stack)
// // // Catch errors 
// process.on('uncaughtException', e => {
//   console.error('An unhandled exception occurred:'); 
//   console.error(e);
  
// });

// process.on('unhandledRejection', e => {
//   console.error('An unhandledRejection exception occurred:');
//   console.error(e);
 
// });
 
/*  to save ouput in file */
console.file = function (data, options={}) { 
  var fs = require('fs');
  var crypto = require('crypto');

  let output_dir = __dirname + '/temp';
  fs.mkdirSync (output_dir, {recursive: true});
  let file_extn = options.extn || ('txt');
  let file_name = options.rand ? `output_${ crypto.randomBytes(5).toString("hex")}.${file_extn}` :`ouput_file.${file_extn}`; 
  file_name = output_dir +"/" + (options.fileName || file_name);

  let text_data = typeof data !== 'string' ? JSON.stringify(data, null, options.space ||2) : (data);
 
  fs.writeFileSync(file_name, text_data);
 
  console.info("Output File :"); 
  console.info(file_name);  
}; 

console.json = function (data, options={ space: 2 }) { 
 console.log( JSON.stringify( data, null ,options.space))
} 
// console.log()  
// console.s = ( data ) =>{
//   let variable_name =  Object.keys( )[0]
//   console.log( "----------------->" + variable_name )
//   console.log(data )
// }

/* 

    // example usage  
console.file("my data",)
console.file("my data", {rand:true}) 
console.file("my data", {fileName:"out_file.txt"}) 

console.file({ name: "johnson"} ,{space: 5}) 
console.file({ name: "johnson"} ,{space: 5 ,rand: true}) 
console.file({ name: "johnson"} ,{space: 5 ,fileName: "temp_file.txt"}) 
console.file({ name: "johnson"} ,{ fileName: "temp_file.txt"}) 

  */
