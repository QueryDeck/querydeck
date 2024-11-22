'use strict';
var bcrypt = require('bcryptjs');
var fs = require('fs');
var catchError = require('../middlewares/catchError');
const os = require('os');
var utils = require('../extras/utils.js');

module.exports = function (router) {

  router.get('/', function (req, res) {
    // return res.zend(undefined, 200, "API is Running !!!");
    let resposne = {
      name: "QuyerDeck !-!",
      session_id: req.sessionID,
      session_sid: req.sessionToken,
      method: req.method,
      user_agent: req.get('User-Agent'),
      network: {
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        // mac_ip : os.networkInterfaces()['en3'][3]['mac'],
        networkInterfaces: os.networkInterfaces(),
      },
      query: req.query,
      body: req.body,
      params: req.params,
      origin: req.origin,
      host: req.get('host'),
      origin: req.get('origin'),
      Host: req.get('Host'),
      Origin: req.get('Origin'),
      hostname: req.hostname,
      headers: req.headers,
      session: req.session,
      date_now1: Date.now(),
      extras: {
        baseUrl: req.baseUrl,
        path: req.path,
        full_url: req.baseUrl + req.path,
        method: req.method,
        app_type: 'api',
      }
    }
    // console.log(req.baseUrl) // '/admin'
    // console.log(req.path) // '/new'
    // console.log(req.baseUrl + req.path) 
    // console.log( req.method )
    resposne = JSON.stringify(resposne, null, 2);
    return res.send(`<pre> ${resposne}  </pre>`)
    if (req.query.type == 1) return res.send(' ' + fs.readFileSync(__dirname + "/../views/welcome_email.html"));
    if (req.query.type == 2) return res.send(' ' + fs.readFileSync(__dirname + "/../views/forgot_email.html"));
    ///home/mohan/DRIVE-D/query-chart/qc-backend-new/public/assets/img/logo.png
    // if( req.query.type == 'logo' ) return res.send(' ' + fs.readFileSync(__dirname + "/../views/forgot_email.html"));
    res.send(' ' + fs.readFileSync(__dirname + "/../config/deployment.txt"));
    // res.send(' ' + fs.readFileSync(__dirname + "/../config/deployment.txt"));
    // qc-backend-new/views/forgot_email.html
    //  let  emailTemplate = fs.readFileSync(__dirname + "/../views/email.html",'utf-8')
    //   // = emailTemplateemailTemplate.toString('utf-8')
    //   require('../temp/email_test.js').sendEmail( 'mohansahualbert@outlook.com', "email template test", emailTemplate)
    //   res.send('sent '   );
  });


  router.all('*', (req, res, next) => {
    let valid_routes = ['/login', '/register', '/logout', '/public',] // routes of apps/*/

    for (let i = 0; i < valid_routes.length; i++) {
      if (req.path.startsWith(valid_routes[i]))
        return next();
    }

    res.zend({ method: req.method }, 404, "Not Found",);
  });
};
