'use strict';
var Sentry = require('../sentry.js');
var db = require.main.require('./lib/maindb.js');
const { POSTGRES } = require('../envconfig.js').constant;

const {
    CronJob,
    sendAt
} = require('cron');

var asyncloop = require('./asyncloop.js').asyncloop;

var ModelManager = require('../models/modelManager.js');
const { toUpper } = require('lodash');
const {
    RE_SYNC_CRON_JOB_TIME
} = require('../envconfig.js').constant;

let lastSyncAt = 0;

function startSyncing() {
    console.log('current time --->', new Date().toLocaleString())

    let data = {
        lastSyncAt: (Date.now() - lastSyncAt) / 1000,
    };
    lastSyncAt = Date.now();



    db.query({
        text: `
        WITH all_subdomains AS (
            SELECT
             subdomain_gen.name AS "subdomain"
            FROM apps
              INNER JOIN databases ON databases.app_id = apps.app_id AND manual_introspection is not true
              INNER JOIN subdomain_gen ON subdomain_gen.app_id = apps.app_id
              INNER JOIN db_types ON db_types.db_type_id = databases.db_type
            WHERE db_types.name = $1
            GROUP BY subdomain_gen.name
          )
          SELECT  
             COALESCE( json_agg(subdomain) , '[]' )  AS subdomains
          FROM all_subdomains;
        
        ;`,

        values: [POSTGRES],
    },
        function (err, result) {
            if (err) {
                console.error(err)
                Sentry.captureError(err)
                return;
            }

            // let clientModels = ModelManager.models;
            // let subdomains = Object.keys(clientModels);
            let subdomains = result.rows[0].subdomains
            // subdomains.reverse();
            // subdomains = ['autumn-silence-1']
            asyncloop(subdomains, function (subdomain, success) {

                // let isSuccessCalled = false;
                // let timeoutId;
                // function callSuccess() {

                //     clearTimeout(timeoutId)

                //     if (!isSuccessCalled) {
                //         success();
                //         isSuccessCalled = true;

                //     }
                //     // else{
                //     //     console.log( 'success alredy calledd **')
                //     // }


                // }
                // timeoutId = setTimeout(() => {
                //     console.log('timeout calling success *****', subdomain)
                //     callSuccess();
                // }, 20000)

                console.log('resync', subdomain)
                ModelManager.loadApp(subdomain, function (err) {

                    if (err) {
                        // Sentry.setExtra('data', JSON.stringify({
                        //     subdomain: subdomain,
                        // }))
                        // Sentry.captureError(err)
                        // callSuccess()
                        // return;
                        console.log(err)
                    }

                    setTimeout(success, 2000);

                    // console.log('finish: ' ,subdomain)   
                }, { reSyncSchema: true })

            }, function () {
                console.log('done')
            })
        })

}

function reSyncSchema() {
    // console.log('stared at ', new Date().toLocaleString())
    // console.log(sendAt(RE_SYNC_CRON_JOB_TIME));
    // return startSyncing();

    new CronJob(
        RE_SYNC_CRON_JOB_TIME, // cronTime
        startSyncing, // onTick
        null, // onComplete
        true, // start
        // 'America/Los_Angeles' // timeZone
    );

}

module.exports = reSyncSchema;
module.exports.startSyncing = startSyncing;