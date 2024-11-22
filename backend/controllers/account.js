'use strict';
var bcrypt = require('bcryptjs');
var crypto = require('crypto')
var fs = require('fs');
var utils = require('../extras/utils');
var catchError = require('../middlewares/catchError');
var envconfigVars = require('../envconfig').vars;
var envconfig = require('../envconfig');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey( envconfigVars.accountEmail.SENDGRID_API_KEY);

const FORGOT_EMAIL = fs.readFileSync(__dirname + "/../views/forgot_email.html", 'utf-8')
module.exports = function (router) {

 
  router.post('/forgot-pass', catchError( async function (req, res) {


    req.body.email = typeof req.body.email === 'string' ? req.body.email.trim() : undefined;
    // req.body.url = typeof req.body.url === 'string' ? req.body.url.trim() : undefined;

    if (!req.body.email  ) return res.zend(null, 400, "Must have field 'email'   ");
    // TODO: try doing  it in single query
    new req.DB({}).executeRaw({
      // dashboards.name,
      // dashboards.db_id,
      // db_types.name as db_type,
      // dashboards.created_at
      text: `
              SELECT
              
                users.email,
                users.user_id, 
                user_verification._id,
                user_verification.created_at,
                EXTRACT(epoch  FROM  now()) - user_verification.created_at AS time_gap 
              FROM   users 
                LEFT JOIN  user_verification   ON user_verification.user_id = users.user_id 
              WHERE
                email =  $1
              ORDER BY
                user_verification.created_at DESC LIMIT 1
            `,

      values: [req.body.email]
    }, async function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 200, "Please check your mail box.If email exist then a verification link will be sent to this email."); //// TODO: change  this line ( it gives information about existence of email in database)
      let row = result.rows[0]

      if (row.time_gap !== null && row.time_gap < envconfigVars.accountEmail.minTimeGap) return res.zend(null, 400, "Please wait for few minute then try again");

      let token = utils.getRandomString(100);


      new req.DB({}).executeRaw({
        text: `
                INSERT INTO  user_verification 
                     (type, token, user_id)
                VALUES ( $1, $2, $3)
                RETURNING * 
                `,

        values: ['forgot_password', token, row.user_id]
      }, async function (err, result_2) {

        if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
        if (!result_2 || !result_2.rows || !result_2.rows.length) return res.zend(null, 500, "something went wrong");


        // include  token and  rowId as verfication id with link utils.getClientDomain(req)
        let html_body_data  = {
          verfication_link : utils.getClientDomain(req) + `/auth/verify?type=forgot&token=${token}&vid=${result_2.rows[0]._id}`,
           ...envconfig.constant.querydeck 
        }
        let msg = {
          to: req.body.email,
          from: process.env.SENDER_MAIL, // Use the email address or domain you verified above
          subject: "Reset Account Password",
          html: utils.replaceAllDataFromText(FORGOT_EMAIL, html_body_data  )  ,
        };
        try {
          await sgMail.send(msg);

        } catch (error) {
          console.error(error);
          if (error.response) {
            console.error(error.response.body)
            return res.zend(null, 500, "something went wrong")
          }
        }
        res.zend(null, 200, "Please check your mail box.If email exist then a verification link will be sent to this email.");

      })


    });

  }));



  router.post('/forgot-pass-verify',  catchError( async function (req, res) {


    req.body.vid = typeof req.body.vid === 'string' ? req.body.vid.trim() : undefined;
    req.body.token = typeof req.body.token === 'string' ? req.body.token.trim() : undefined;
      //TODO: check expire time to  have at least 5 minutes to get expire 

    new req.DB({}).executeRaw({

      text: ` 
                      SELECT 
                        user_verification.user_id ,
                        user_verification._id
                      FROM   users 
                        LEFT JOIN  user_verification   ON user_verification.user_id = users.user_id 
                      WHERE
                        user_verification._id = $1
                        AND user_verification.token = $2
                        AND user_verification.type = 'forgot_password'
                        AND ( EXTRACT(epoch  FROM  now()) - user_verification.created_at) <  $3
             
            `,

      values: [req.body.vid, req.body.token, envconfigVars.accountEmail.forgotExpireTime]
    }, async function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 400, "Invalid or Expired link");

      return res.zend(null, 200, "Successfully Verified")



    });


  }));

  router.post('/forgot-pass-reset',  catchError( async function (req, res) {


    req.body.vid = typeof req.body.vid === 'string' ? req.body.vid.trim() : undefined;
    req.body.token = typeof req.body.token === 'string' ? req.body.token.trim() : undefined;
    req.body.password = typeof req.body.password === 'string' ? req.body.password.trim() : undefined;

    if (!req.body.vid || !req.body.token) return res.zend(null, 400, "Must have field 'password', 'vid' and 'token'");
    if (req.body.password.length < 6 || req.body.password.length > 100) return res.zend(null, 400, "'password' must have atleast 6 characters ");

    bcrypt.hash(req.body.password, envconfigVars.USER_ACCOUNT_SALT, function (err, hashed_pass) {
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
      if (err) return res.zend(null, 400, err?.message);

      //TODO: check expire time to  have at least 5 minutes to get expire 

      new req.DB({}).executeRaw({

        text: `
            

                    WITH  sel_users AS  ( 
                      SELECT 
                        user_verification.user_id ,
                        user_verification._id
                      FROM   users 
                        LEFT JOIN  user_verification   ON user_verification.user_id = users.user_id 
                      WHERE
                        user_verification._id = $1
                        AND user_verification.token = $2
                        AND user_verification.type = 'forgot_password'
                        AND ( EXTRACT(epoch  FROM  now()) - user_verification.created_at) <  $3
                      )  ,

                      update_users AS (
                        UPDATE  users
                        SET passhash = $4
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

        values: [req.body.vid, req.body.token, envconfigVars.accountEmail.forgotExpireTime, hashed_pass]
      }, async function (err, result) {

        if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
        if (!result || !result.rows || !result.rows.length) return res.zend(null, 400, "Invalid or Expired link");

        return res.zend(null, 200, "Successfully Updated")



      });
    })

  }));



  // ###  Change Account password (required login )
  router.post('/change-password', catchError( async function (req, res) {


    req.body.old_password = typeof req.body.old_password === 'string' ? req.body.old_password.trim() : undefined;
    req.body.new_password = typeof req.body.new_password === 'string' ? req.body.new_password.trim() : undefined;

    if (!req.body.old_password || !req.body.new_password) return res.zend(null, 400, "Must have field 'old_password'  and 'new_password'");
    if (req.body.new_password.length < 6 || req.body.new_password.length > 100) return res.zend(null, 400, "'password' must have atleast 6 characters ");

    new req.DB({}).executeRaw({

      text: `
      SELECT  passhash 
      FROM  users  
      WHERE  users.user_id = $1

          `,

      values: [req.user_id]
    }, function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 404, "Not Found");

      bcrypt.compare(req.body.old_password, result.rows[0].passhash, function (err, isMatched) {
        if (err) return res.zend(null, 500, err?.message);
        if (isMatched === false) return res.zend(null, 400, "Incorrect Password");


      });
      bcrypt.hash(req.body.new_password, envconfigVars.USER_ACCOUNT_SALT, function (err, hashed_pass) {
        if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
        if (err) return res.zend(null, 400, err?.message);

        //TODO: check expire time to  have at least 5 minutes to get expire 

        new req.DB({}).executeRaw({

          text: `  
            UPDATE  users
            SET passhash = $2
            WHERE 
                user_id =  $1 
            RETURNING user_id 

            `,

          values: [req.user_id, hashed_pass]
        }, async function (err, result) {

          if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
          if (!result || !result.rows || !result.rows.length) return res.zend(null, 400, "Invalid User");

          return res.zend(null, 200, "Successfully Updated")


        });
      }) 

    });

  }));



    // ###  Get Account details (required login )
    router.get('/details', catchError( async function (req, res) {

 
   
      new req.DB({}).executeRaw({
  
        text: `  
          SELECT 
            email,
            api_project,
            tour,
            preference
          FROM  users  
          WHERE 
            user_id =  $1 
  
          `,
  
        values: [req.user_id ]
      },  function (err, result) {
  
        if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
        if (!result || !result.rows ) return res.zend(null, 400, "Invalid User");
        res.zend({
          email : result.rows[0].email, 
          api_project : result.rows[0].api_project, 
          preference : result.rows[0].preference  || {} , 
          tour : result.rows[0].tour  , 
          
        });
  
      });
    }));

    
  // ###  Update Account details (required login )
  router.put('/details', catchError( async function (req, res) {

 
    if (  !req.body.preference    ) 
      return res.zend(null, 400, "Must have field   'preference'  ");

    new req.DB({}).executeRaw({

      text: `  
        UPDATE  users
        SET  
           preference = $2
        WHERE 
            user_id =  $1 
        RETURNING preference 

        `,

      values: [req.user_id,   req.body.preference]
    },  function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);
      if (!result || !result.rows ) return res.zend(null, 400, "Invalid User");
      result.rows[0].preference = result.rows[0].preference ||{ tour: false } ;
      return res.zend(result.rows[0], 200, "Successfully Updated")

    });
  }));


  // ### temporary endpoint to delete account with 0 apps
  router.delete('/remove',  catchError( async function (req, res) {

     res.zend(null, 403, "Blocked")
    req.body.email  = typeof req.body.email  === 'string' ? req.body.email .trim() : undefined;
    
    if (!req.body.email  ) return res.zend(null, 400, "Must have field 'email' ");
   // TODO: remove all table refence then delete account
    new req.DB({}).executeRaw({

      text: ` 

      WITH  del_user_verification AS( 
        delete  FROM public.user_verification
        where user_id = ( select user_id from users where email = $1)
        
        )
       
       delete  FROM public.users
       where email = $1 
       returning * 
       
       
             
            `,

      values: [req.body.email]
    }, async function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);

      return res.zend(null, 200, "Deleted successfully")
 

    });


  }));

  router.all('/*', (req, res) => {
    res.zend({ method: req.method }, 404, "Not Found",);
  });
};
