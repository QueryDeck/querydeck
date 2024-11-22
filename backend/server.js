'use strict';
require('dotenv').config();
var init = require('./init.js');
var app = require('./index');
var http = require('http').Server(app);
var https = require('https');
var PORT = process.env.PORT || process.env.port || 3000;
var fs = require('fs');
var Sentry = require('./sentry.js');

/*
 * Create and start HTTP server.
 */
 

//#### FOR LOCAL DEVELOPEMENT ONLY #######
if( process.env.PROJECT_ENV !== 'prod' && process.platform == 'linux' &&  process.env.COMPUTER_PASS  ){
  let  execCommand = require("./lib/execCommand"); 
  let command = 'echo '  + process.env.COMPUTER_PASS + ' | sudo -S   sudo systemctl start mongod ' ;
  execCommand(command, {maxExecTime: 20000}) 
  .then((res) => {
     console.log("Mongodb started ")
   
  })
  .catch((err) => {
     console.log(err) 
 
  });
}

init(function (err) {
  if (err) return console.error('Error starting app', err);

  app.disable('etag');

  Sentry.useRequestHandler(app);
  app.use(require('kraken-js')());
  Sentry.useErrorHandler(app); 

  
  // sentry.useErrorHandler(app); 
//   app.use(sentry.Handlers.errorHandler(
//     {
//         shouldHandleError(error) {
//           // Capture all 404 and 500 errors
//              console.log( "----------shouldHandleError------------")
//     console.log( error)
//           if (error.status === 404 || error.status === 500) {
//             return true;
//           }
//           return false;
//         },
//       }

// ));
  // app.get('/main', function(req, res){
  //   let file = __dirname + "/.build/apps.html" 
  //   console.log(file )
  //   res.sendFile( file);
  // });

  // app.get('/', (req, res) => {
  //   res.send('hello world')
  // })


  if (false && process.env.PROJECT_ENV == "prod") {
  /* run server using https module */
    let SELF_DOMAIN = process.env.SELF_DOMAIN ; 
    const privateKey = fs.readFileSync('/etc/letsencrypt/live/' + SELF_DOMAIN + '/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/' + SELF_DOMAIN + '/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/' + SELF_DOMAIN + '/chain.pem', 'utf8');

    const credentials = {
      key: privateKey,
      cert: certificate,
      ca: ca
    };

    const httpsServer = https.createServer(credentials, app); 
    httpsServer.listen(PORT, () => {
      console.info('HTTPS listening on %d', PORT);
    });

  } else {
    /* run server using http module */
    http.listen(PORT);
    http.on('listening', function () {
      console.info('Server listening on http://localhost:%d', PORT);

    });

  }

});
