
var db = require.main.require('./lib/maindb.js');
var request = require('request');
var github_keys = require.main.require('./envconfig.js').vars.github;
const {
    CronJob,
    sendAt
} = require('cron');
var asyncloop = require.main.require('./lib/asyncloop.js').asyncloop;

exports.start = start;
exports.refreshGithubTokens = refreshGithubTokens
function start() {
    new CronJob(
        '0 0-23/3 * * *', // cronTime
        refreshGithubTokens, // onTick
        null, // onComplete
        true, // start
        // 'America/Los_Angeles' // timeZone
    );
}

function refreshGithubTokens() {

    db.query({
        text: `select github_ob, user_id from users where github_ob is not null`
    }, function(err, result) {
        if(err) {
            console.error(err);
            return;
        }

        result.rows = result.rows || []

        asyncloop(result.rows, function(user, success) {

            var refresh_token = user.github_ob.token.refresh_token;

            if(!refresh_token) {
                return success();
            }

            request({
                url:  `https://github.com/login/oauth/access_token?client_id=${github_keys.client_id}&client_secret=${github_keys.client_secret}&refresh_token=${refresh_token}&grant_type=refresh_token`,
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                }
            }, function(error, response, body) {
                if(error) {
                    console.error(error);
                    return success();
                }

                var token_split = body.split('&')
                var token_ob = {}
                for(var i=0; i<token_split.length; i++){
                    var current_split = token_split[i].split('=')
                    token_ob[current_split[0]] = current_split[1]
                }

                if(!token_ob.access_token) {
                    return success();
                }

                token_ob.unix = Date.now()

                user.github_ob.token = token_ob;

                db.query({
                    text: `update users set github_ob = $1 where user_id = $2`,
                    values: [user.github_ob, user.user_id]
                }, function(err, result) {
                    if(err) {
                        console.error(err);
                        return success();
                    }
                    success()
                });

            });
            

        }, function() {
            console.log('done');
        });

        
    });

}