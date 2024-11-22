const Sentry = require("@sentry/node");
const { functions } = require("lodash");
// const { propfind } = require(".");
// const PROJECT_ENVIRONMENT = 'prod'  ;
const PROJECT_ENVIRONMENT =   process.env.PROJECT_ENV;


if (PROJECT_ENVIRONMENT == 'prod') {
  Sentry.init({ 
    dsn: process.env.SENTRY_DNS,
    // integrations: [new Sentry.Integrations.d],
    // normalizeDepth: 10,
    beforeSend(event) {
      // remove cookies from getting saved in sentry 
      if( event?.request?.headers?.cookie) event.request.headers.cookie = ''; 
      if( event?.request?.cookies) event.request.cookies = '';  
      // if(  event?.request?.data )  event.request.data = {};  
      // console.log(  event?.request?.data )
      return event;
    },
  
  });
}

 function addOpenReplayData(req,res,next) {
  const orSessionToken = req.get('X-OpenReplay-SessionToken');
  const orsessionUrl = req.get('X-OpenReplay-SessionURL');

  if (orSessionToken) {
    Sentry.setTag("openReplaySessionToken", orSessionToken);
  }
  if (orsessionUrl) {
    Sentry.setTag("openReplaySessionURL", orsessionUrl);
  }
  next && next(); 
 }

function useRequestHandler(app) {
  if (PROJECT_ENVIRONMENT !== 'prod') return;

  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  app.use(addOpenReplayData)

}



function useErrorHandler(app) {

  if (PROJECT_ENVIRONMENT !== 'prod') return;
  //  The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler(
    // {
    //   shouldHandleError(error) {
    //     // Capture all 404 and 500 errors
    //     console.log("----------shouldHandleError------------")
    //     console.log(error)
    //     if (error.status === 404 || error.status === 500) {
    //       return true;
    //     }
    //     return false;
    //   },
    // }

  ));

}




function saveData(req) {
  Sentry.setUser({
    email: req?.session?.user?.email,
    user_id: req?.session?.user?.user_id,
  })

  Sentry.setExtra('request_body', JSON.stringify(req.body, null, 2))
  Sentry.setExtra('request_query', JSON.stringify(req.query, null, 2))

  addOpenReplayData(req) ; 


}


function captureError(error) {
//  console.log( "------------inside sentr-----------")
//  console.log( "------------inside sentr-----------")
  if (PROJECT_ENVIRONMENT !== 'prod') return;

  // The request handler must be the first middleware on the app
  // console.log( error?.message || error)
  Sentry.captureException(error,
    // {
    //   tags: {
    //     section: "articles",
    //   },
    // }
  );



}

module.exports = Sentry;
module.exports.useRequestHandler = useRequestHandler;
module.exports.useErrorHandler = useErrorHandler;
module.exports.captureError = captureError;
module.exports.saveData = saveData;

