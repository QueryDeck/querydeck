'use strict';

var ModelManager = require('./models/modelManager.js');

var methods = [function (callback){

  ModelManager.loadMain(function(err){ 
    if(err) return callback(err);
    // console.log(" -----> Main model loaded");

    callback()
 
  });

}
, function(callback){
  require('./lib/cipher2.js').init(function(err){
    if(err) return callback(err);
    callback()
  })
}, function(callback){

  // require('./lib/migrate_cipher.js').migrateCipher(function(err){
  //   if(err) return callback(err);
  //   callback()
  // })

  callback()
}
];

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