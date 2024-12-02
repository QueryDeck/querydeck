
var envconfig = require.main.require('./envconfig.js').vars;
var cipherDB = new (require("../lib/cipher.js"))(envconfig.cipher.secret, envconfig.cipher.algorithm);
var authCipher = new (require("../lib/cipher.js"))(envconfig.auth.secret, envconfig.auth.algorithm );
var asyncloop = require.main.require('./lib/asyncloop.js').asyncloop;

var DB = require.main.require('./models/index.js').db;

var models = require.main.require('./models/modelManager').pgtmodels.models;

// exports.start = start;
exports.migrateCipher = migrateCipher

var cipherNew = require.main.require('./lib/cipher2.js');

function migrateCipher() {

    new DB({}).execute([
        new models.public.databases().select().where({
            host: {
                $null: false,
                '$!eq': ''
            }
        })
        // .limit(10)
        .aggAlias('databases'),
        new models.public.users().select().where({
            github_ob: {
                $null: false
            }
        }).aggAlias('git_users'),
        new models.public.auth_details().select().where({
            client_secret_encrypted: {
                $null: false
            }
        }).aggAlias('auth_details'),
    ], function(err, result) {
        if(err) {
            console.error(err);
            return;
        } 

        result.databases = result.databases || [];
        asyncloop(result.databases, function(element, success) {

            element.username = cipherDB.decrypt(element.username);
            element.password = cipherDB.decrypt(element.password);
            element.host = cipherDB.decrypt(element.host);
            element.name = cipherDB.decrypt(element.name); 

            var username_encrypted = cipherNew.encrypt(element.username);
            var password_encrypted = cipherNew.encrypt(element.password);
            var host_encrypted = cipherNew.encrypt(element.host);
            var name_encrypted = cipherNew.encrypt(element.name);

            console.log(element, username_encrypted, password_encrypted, host_encrypted, name_encrypted);

            return success();

            new DB({}).execute([
                new models.public.databases().update({
                    username: username_encrypted,
                    password: password_encrypted,
                    host: host_encrypted,
                    name: name_encrypted
                }).where({db_id: element.db_id})
            ], function(err, result) {
                if(err) {
                    return console.error(err);
                }
                console.log('databases', element.db_id);
                return success();
            })

        }, function() {

            // return;

            result.git_users = result.git_users || [];
            asyncloop(result.git_users, function(element, success) {

                element.github_ob.token_encrypted = cipherNew.encrypt(JSON.stringify(element.github_ob.token));
                delete element.github_ob.token;

                console.log(element.github_ob);

                return success();

                new DB({}).execute([
                    new models.public.users().update({
                        github_ob: element.github_ob
                    }).where({user_id: element.user_id})
                ], function(err, result) {
                    if(err) return console.error(err);
                    console.log('git_users', element.user_id);
                    return success();
                })

            }, function() {
                
                result.auth_details = result.auth_details || [];
                asyncloop(result.auth_details, function(element, success) {

                    element.client_secret_encrypted = authCipher.decrypt(element.client_secret_encrypted);

                    var client_secret_encrypted_new = cipherNew.encrypt(element.client_secret_encrypted);

                    console.log(element.client_secret_encrypted, client_secret_encrypted_new);
                    
                    return success();

                    new DB({}).execute([
                        new models.public.auth_details().update({
                            client_secret_encrypted: client_secret_encrypted_new
                        }).where({auth_detail_id: element.auth_detail_id})
                    ], function(err, result) {
                        if(err) return console.error(err);
                        console.log('auth_details', element.auth_detail_id);
                        return success();
                    })

                }, function() {
                    console.log('done');
                });
            });

        });
    })

}