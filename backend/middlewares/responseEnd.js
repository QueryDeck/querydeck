
'use strict';
var Sentry = require('../sentry');

//responseEnd  is called after response is seneded 
function responseEnd(func) {
    return (req, res, next) => {
        res.on('finish', async () => {
        // You might have to add a logic here like if(req.user) then perform following things
        // Do whatever you want to do here after every API call finishes
        // you can access res.statusCode, req.method etc.
        // console.log( "finished*****")
          if(   !res.zend ){  
            let message  =   "'zend' function  is not defined ";
            let status = res.statusCode ;
            let myError = new Error(message)
            myError.message += ' (status: ' + status + ')'
            myError.statusCode = status
            Sentry.saveData(req); 
            Sentry.captureError(myError);
          }

        });
        next();
        }
};


module.exports = responseEnd