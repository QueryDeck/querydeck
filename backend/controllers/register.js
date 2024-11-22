'use strict';
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var validator = require('validator');
const envconfig = require('../envconfig');
var catchError = require('../middlewares/catchError');
var envconfigVars = require('../envconfig').vars;
const sgMail = require('@sendgrid/mail');
var utils = require('../extras/utils');
var slack = require('../extras/slack');
var fs = require('fs');
sgMail.setApiKey(envconfig.vars.accountEmail.SENDGRID_API_KEY);
const WELCOME_EMAIL = fs.readFileSync(__dirname + "/../views/welcome_email.html", 'utf-8')


module.exports = function (router) {

  router.post('/', catchError(async function (req, res) {

    // return res.send("till here");
    req.body.email = typeof req.body.email == 'string' ? req.body.email.trim() : "";
    req.body.password = typeof req.body.password == 'string' ? req.body.password.trim() : "";

    if (!req.body.email || !req.body.password) return res.zend(null, 400, "Must have 'email' and 'password'  ");
    if (!validator.isEmail(req.body.email)) return res.zend(null, 400, "Invalid Email");
    if (req.body.password.length < 6 || req.body.password.length > 100) return res.zend(null, 400, "'password' must have atleast 6 characters ");

    bcrypt.hash(req.body.password, envconfig.vars.USER_ACCOUNT_SALT, function (err, hashed_pass) {
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500);
      if (err) return res.zend(null, 400,);
      //TODO: create eamil and token in single sql statement 
      new req.DB({}).executeRaw({
        text: "INSERT INTO   users(email, passhash,api_project) VALUES ($1, $2, $3) RETURNING *",
        values: [req.body.email, hashed_pass, true]
      }, function (err, result) {
        if (err?.message == 'duplicate key value violates unique constraint "users_email_key"') return res.zend(null, 409, 'Email Already Exists'); //TODO: remove this line ( it gives information about existence of email in database)
        if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
        if (!result || !result.rows || !result.rows.length) return res.zend(null, 500, "something went wrong");


        let token = utils.getRandomString(100);

        new req.DB({}).executeRaw({
          text: `
                  INSERT INTO  user_verification 
                       (type, token, user_id)
                  VALUES ( $1, $2, $3)
                  RETURNING * 
                  `,

          values: ['account_verify', token, result.rows[0].user_id]
        }, async function (err, result_2) {
          if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
          if (!result_2 || !result_2.rows || !result_2.rows.length) return res.zend(null, 500, "something went wrong");


          // include  token and  rowId as verfication id with link utils.getClientDomain(req)
          let html_body_data = {
            verfication_link: utils.getClientDomain(req) + `/auth/verify?type=account&token=${token}&vid=${result_2.rows[0]._id}`,
            ...envconfig.constant.querydeck
          }

          let msg = {
            to: req.body.email,
            from: process.env.SENDER_MAIL, // Use the email address or domain you verified above
            subject: "Verify Account",
            html: utils.replaceAllDataFromText(WELCOME_EMAIL, html_body_data),
          };
          // try {
          //   await sgMail.send(msg);

          // } catch (error) {
          //   console.error(error);
          //   if (error.response) {
          //     console.error(error.response.body)
          //     return res.zend(null, 500, "something went wrong")
          //   }
          // }
          delete result.rows[0].passhash;
          delete result.rows[0].github_ob;
          req.session.user = result.rows[0];
          res.zend({

            details: {
              user_id: result.rows[0].user_id,
              email: result.rows[0].email,
            },
            preferences: result.rows[0].preference || {}
          }, 200, "Successfully Registered");

          slack.sendNewUserNotification({
            name: req.body.email.split('@').shift(),
            email: req.body.email,
            isApiProject: true
          })
        })

      });


    });

  }))


  router.post('/verify', catchError(async function (req, res) {


    req.body.vid = typeof req.body.vid === 'string' ? req.body.vid.trim() : undefined;
    req.body.token = typeof req.body.token === 'string' ? req.body.token.trim() : undefined;
    if (!req.body.vid || !req.body.token) return res.zend(null, 400, "Must have field 'password', 'vid' and 'token'");

    //TODO: check expire time to  have at least 5 minutes to get expire 
    new req.DB({}).executeRaw({

      text: ` 
      WITH  sel_users AS  ( 
        SELECT 
          user_verification.user_id ,
          user_verification._id,
          users.email
        FROM   users 
          LEFT JOIN  user_verification   ON user_verification.user_id = users.user_id 
        WHERE
          user_verification._id = $1
          AND user_verification.token =  $2
          AND user_verification.type = 'account_verify'
          AND ( EXTRACT(epoch  FROM  now()) - user_verification.created_at) <  $3
        )  ,

        update_users AS (
          UPDATE  users
          SET email_verified = 'true'
          WHERE 
              user_id =  ( SELECT user_id from sel_users  ) 
        ),

        delete_user_verification AS ( 
          DELETE 
            FROM   user_verification 
          WHERE  
          user_verification._id = ( SELECT _id from sel_users  ) 
        )
        SELECT * FROM sel_users 
             
            `,

      values: [req.body.vid, req.body.token, envconfigVars.accountEmail.forgotExpireTime]
    }, async function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 400, "Invalid or Expired link");

      req.session.user = { user_id: result.rows[0].user_id, email: result.rows[0].email };
      return res.zend({ email: result.rows[0].email }, 200, "Successfully Verified")



    });


  }));

  router.post('/resent-account-verify', catchError(async function (req, res) {


    if (!req.user_id) return res.zend(null, 400, "Login Required");
    // TODO: try doing  it in single query
    new req.DB({}).executeRaw({
      // dashboards.name,
      // dashboards.db_id,
      // db_types.name as db_type,
      // dashboards.created_at
      text: `
              SELECT
                users.email,
                users.email_verified,
                users.user_id, 
                user_verification._id,
                user_verification.created_at,
                EXTRACT(epoch  FROM  now()) - user_verification.created_at AS time_gap 
              FROM   users 
                LEFT JOIN  user_verification   ON user_verification.user_id = users.user_id 
              WHERE
                users.user_id =  $1
              ORDER BY
                user_verification.created_at DESC LIMIT 1
            `,

      values: [req.user_id]
    }, async function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 200, "Please check your mail box.If email exist then a verification link will be sent to this email."); //// TODO: change  this line ( it gives information about existence of email in database)
      let row = result.rows[0]
      console.log(row)
      // return ;``
      if (row.time_gap !== null && row.time_gap < envconfigVars.accountEmail.minTimeGap) return res.zend(null, 400, "Please wait for few minute then try again");
      if (row.email_verified) return res.zend(null, 400, "Email is Already Verified")
      let token = utils.getRandomString(100);


      new req.DB({}).executeRaw({
        text: `
                INSERT INTO  user_verification 
                     (type, token, user_id)
                VALUES ( $1, $2, $3)
                RETURNING * 
                `,

        values: ['account_verify', token, row.user_id]
      }, async function (err, result_2) {

        if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
        if (!result_2 || !result_2.rows || !result_2.rows.length) return res.zend(null, 500, "something went wrong");



        // include  token and  rowId as verfication id with link utils.getClientDomain(req)
        let html_body_data = {
          verfication_link: utils.getClientDomain(req) + `/auth/verify?type=account&token=${token}&vid=${result_2.rows[0]._id}`,
          ...envconfig.constant.querydeck
        }
        let msg = {
          to: row.email,
          from: process.env.SENDER_MAIL, // Use the email address or domain you verified above
          subject: "Verify Account",
          html: utils.replaceAllDataFromText(WELCOME_EMAIL, html_body_data),
        };

        // try {
        //   await sgMail.send(msg);

        // } catch (error) {
        //   console.error(error);
        //   if (error.response) {
        //     console.error(error.response.body)
        //     return res.zend(null, 500, "something went wrong")
        //   }
        // }
        res.zend(null, 200, "Please check your mail box.A verification link is sent to this mail");

      })


    });

  }));



  router.all('/*', (req, res) => {
    res.zend({ method: req.method }, 404, "Not Found",);
  });
};
