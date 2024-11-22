
'use strict';
exports.asyncloop = function (arr, func, finalCallback){
  var total = arr.length;
  var current = 0;
  function repeater() {
    if(current == total) return finalCallback();
    func(
      arr[current], 
      function(){
        ++current;
        repeater();
      },
      function(err){
        require.main.require('./lib/errors.js')({err: err, line: 0, file: __filename});
        ++current;
        repeater();
      }
    );
  }
  repeater();
};