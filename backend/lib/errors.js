'use strict';
// var mail = require.main.require('./lib/mailer.js');
var envconfig = require.main.require('./envconfig.js');
module.exports = function(params){
  console.log('HERE');
  if(!params.err) return true;
  if(params.next) params.next(params.err);
  console.log('Error in file:', params.file, ':', params.line, params.err);
  //   if(envconfig.vars.Prod) {
  // mail.send({
  //         to: '1119231@gmail.com',
  //         subject: 'ZAS Error',
  //         html: (new Date).toUTCString() + ' zaserror:' + JSON.stringify(params)
  //       }, function (params) {
  //         // process.exit(1);
  //       });
  //   }
  
  return false;
};
