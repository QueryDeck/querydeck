'use strict';
exports.vars = {

  PG: {
    Admin: process.env.pg_querydeck_url
  },

  jwt: {
    // one week in seconds
    expiry_time: 604800
  },
  github: {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET
  },
  cipher: { 
    secret: process.env.CIPHER_KEY,
    algorithm: 'aes-256-ctr' // cipher algorithm name 
  }, 
  mongoStore: {
    secret:  process.env.MONGO_SECRET  , //session secret string
    connString: process.env.MONGO_CONN_URL
  },
  accountEmail:{
      minTimeGap : 10 , // minimum time between mail sent for an account email 
      forgotExpireTime : 100000 , // forgot password email expire time in seconds
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY
  },
  auth:{ // app authentcation 
    algorithm: 'aes-256-ctr' ,// cipher algorithm name 
    secret : process.env.AUTHENTICATE_APP,
    expiry_time: 604800 // one week 
},
  Prod: process.env.zas_db ? true : false,
  USER_ACCOUNT_SALT : 8 ,
};

exports.def = {};

exports.constant = {
  MYSQL: "MySQL",
  POSTGRES: "Postgres",
  
  REQUEST_BODY_SIZE: '500kb',  // maximum size of request body 


  MAX_CONNECTION_POOL: 8, 
  DASHBOARD_SALT : 8 ,
  DASHBOARD_ALOG_NAME:  'aes-256-ctr',
  RE_SYNC_SCHEMA_TIME:  43200000 , // 24 hours in milliseconds ,
  RE_SYNC_CRON_JOB_TIME:  '0 0-23/3 * * *' , // every 3  hours   ,

  querydeck:{
    'PROJECT_WEBSITE_NAME': 'QueryDeck', 
    'PROJECT_WEBSITE_URL' : 'https://querydeck.io',
    'PROJECT_WEBSITE_LOGO' : 'https://res.cloudinary.com/marquee/image/upload/v1712579198/querycharts/email/Screenshot_from_2024-04-08_17-55-23_bsqp2h.png',
  
  }
};
