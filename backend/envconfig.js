'use strict';
exports.vars = {

  PG: {
    // Sessions: process.env.sessions_db || 'pg://postgres:@localhost:5432/sessions schma_test',
    // Admin: 'postgres://kabirnarain:@localhost:5432/pgtadmin',
    // ZASPrefix: process.env.zasuserdb_prefix || 'pg://kabir:@localhost:5432/'
    Admin: process.env.zasuserdb_prefix + 'pgtadmin',
    ZASPrefix: 'pg://kabirnarain:@localhost:5432/'
  },

  jwt: {
    secret: 'MIIBOwIBAAJBAKCUBH7b+Pdsx26QnWF6MiTOxEcJQElynmejwV05478y2+vp0dbP1hqPpqWVKXW+Ld4w03LxYnyWYZf8jJQIQqcCAwEAAQJAHTu1Mc8kHQ89o2BKdoODe3X0/6WsgXKPafjC7BDs6FK1KTg/xkQmvNzeIyKQFIkDddOiSpPt0+zodWEOtcwciQIhAMzYHNAUoQMl7u5YwOyVa1d4NshSENkdN0SavlMoKPqDAiEAyK3v38gQSoMWXfehgm/S9KJgFsvcYwLVnEOnJUxQLg0CIQCxYE2KzOIjpLxBfW8JLdV2N21Qhud56XeLG2fFABiD2wIhAL5ifeMBK6t1J+AoETrtGebqsVyPNVtdkgg5CrbQ6nR1AiBaEoBbX8byX5AlELo9qJCUgejOxWsjxaDHtjFfIf0beg==',
    // one week in seconds
    expiry_time: 604800
  },
  github: {
    client_id: 'Iv23libtvyTeofplCAMs',
    client_secret: 'c8cf238608d0204b20110ebee38c5b58dbc06816'
  },
  cipher: { 
    // secret_old: 'abcdefghijklmnopqrs()=?^"!|[;,_@#<>tuvwJKLMNOPQRSTUVWX()=?^;,_@#<>xyzABCDEFGHIJKLMNOPQRSTUVW 89$%&/()=?^"!|[]{}*+-:.;,_@#<>',
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
  DASHBOARD_ALOG_SECRET : "dsjf08()*()&*8()*()&dfsdDSF^&)^8()*()&&D%FD(*FD(FJD",
  DASHBOARD_ALOG_NAME:  'aes-256-ctr',
  RE_SYNC_SCHEMA_TIME:  43200000 , // 24 hours in milliseconds ,
  RE_SYNC_CRON_JOB_TIME:  '0 0-23/3 * * *' , // every 3  hours   ,


  querycharts:{
    'PROJECT_WEBSITE_NAME': 'QueryCharts', 
    'PROJECT_WEBSITE_URL' : 'https://querycharts.com',
    'PROJECT_WEBSITE_LOGO' : 'https://querycharts.com/assets/img/logo.png',

  }
,
  querydeck:{
    'PROJECT_WEBSITE_NAME': 'QueryDeck', 
    'PROJECT_WEBSITE_URL' : 'https://querydeck.io',
    'PROJECT_WEBSITE_LOGO' : 'https://res.cloudinary.com/marquee/image/upload/v1712579198/querycharts/email/Screenshot_from_2024-04-08_17-55-23_bsqp2h.png',
  
  }
};
