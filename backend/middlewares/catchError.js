
'use strict';
var Sentry = require('../sentry');

 
function catchError(func) {
    return (req, res, next) => {
      console.log( 'insdie catchError ')
        func(req, res, next).catch((err) => {
            try {
                let message = err?.message || err || 'Something Went Wrong'
                let statusCode = err?.statusCode || 500
                if (res.zend) {
                    res.zend(null, statusCode, message, {isAlreadySentError: true })
                }
                else {
                    res.status(statusCode).json({
                        meta: {
                            status: statusCode,
                            message: message
                        },
                        data: null
                    });

                }
                if( typeof err !== 'object') err = {err}
                err.message = message + ' (status: ' +statusCode+ ')'; 
                if(statusCode >=500){ 
                    Sentry.saveData(req)
                    Sentry.captureError(err)
                }
    
                console.error( err) 
            }
            catch (err) {
                console.error(err);
                Sentry.captureError(err)

            }

        })
            ;
    };
};


module.exports = catchError