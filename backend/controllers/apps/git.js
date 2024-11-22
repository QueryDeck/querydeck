'use strict';
var catchError = require.main.require('./middlewares/catchError');
var request = require('request');
var repoManager = require.main.require('./repo-gen/index.js')

module.exports = function(router) {

    // status:
    // 0 = no integration, show github oauth button
    // 10 = oauth done but app not installed, show installation and repo selection flow
    // 20 = repo integration done, show diff and commit + push
    router.get('/status', catchError(async function(req, res) {

        new req.DB({}).execute([
            new req.models.public.users().select({github_ob: true}).where({
                user_id: req.user_id
            }).aggAlias('users')
        ], function(err, result){
            if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500);
            if(!result.users || !result.users[0]) return res.zend(null, 403);
            var user = result.users[0];

            var status = 0;
            
            if (!user.github_ob || !user.github_ob.token.access_token) {
                return res.zend({
                    status: status
                });
            } else {
                status = 5;
            }

            if(!req.query.subdomain || !req.clientModels[req.query.subdomain] || req.user_id !== req.clientModels[req.query.subdomain].appDetails.created_by) return res.zend({status: status})

            new req.DB({}).execute([
                new req.models.public.git_deployment().select({
                    github_repo_name: true,
                    github_details: true
                }).where({
                    app_id: {
                        $inq: new req.models.public.apps().select({app_id: true}).where({
                            app_id: {
                                $inq: new req.models.public.subdomain_gen().select({ app_id: true }).where({
                                    name: req.query.subdomain
                                })
                            },
                            created_by: req.user_id
                        })
                    }
                }).aggAlias('apps')
            ], function(err, result) {
                if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500);

                var repo_url;

                if(result.apps && result.apps[0] && result.apps[0].github_repo_name && result.apps[0].github_details && result.apps[0].github_details.integrated) {
                    status = 20
                    repo_url = 'https://github.com/' + result.apps[0].github_repo_name
                } else {
                    status = 10
                }

                res.zend({
                    status: status,
                    repo_url: repo_url
                });
                
            });
            
            
        })

    }));

    router.get('/installed-repos', catchError(async function(req, res) {

        new req.DB({}).execute([
            new req.models.public.users().select({
                github_ob: true
            }).where({
                user_id: req.user_id
            }).aggAlias('u')
          ], function (err, result) {
            if (err) {
                console.log(err);
                return res.zend(err, 500, "Internal Server Error");
            }
            if(!result.u || !result.u[0] || !result.u[0].github_ob || !result.u[0].github_ob.token) return res.zend([]);
            request({
                url:  `https://api.github.com/user/installations`,
                method: 'GET',
                headers: {
                    'accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${result.u[0].github_ob.token.access_token}`,
                    'user-agent': 'node.js'
                }
            }, function(error, response, body) {
                if (error) {
                    console.log(error);
                    return res.zend(error, 500, "Internal Server Error");
                }
                body = JSON.parse(body);
                console.log( body)
                if(!body.installations || !body.installations[0]) return res.zend([]);
                request({
                    url:  `https://api.github.com/user/installations/` + body.installations[0].id + '/repositories',
                    method: 'GET',
                    headers: {
                        'accept': 'application/vnd.github+json',
                        'Authorization': `Bearer ${result.u[0].github_ob.token.access_token}`,
                        'user-agent': 'node.js'
                    }
                }, function(error, response, repos) {
                    if (error) {
                        console.log(error);
                        return res.zend(error, 500, "Internal Server Error");
                    }
                    console.log(3)
                    repos = JSON.parse(repos);
                    var repo_name_arr = [];
                    repos.repositories = repos.repositories || []
                    repos.repositories.forEach(repo => {
                        repo_name_arr.push(repo.full_name);
                    });

                    if(repo_name_arr.length == 0) return res.zend(repos.repositories);

                    var final_repos = [];

                    console.log('repo_name_arr', repo_name_arr)

                    new req.DB({}).execute([
                        new req.models.public.git_deployment().select({github_repo_name: true}).where({
                            // github_repo_name: {$in: repo_name_arr}
                            $raw: " (github_repo_name in ('" + repo_name_arr.join("','") + "')) "
                        }).aggAlias('existing_repos')
                    ], function(error, result){
                        if (error) {
                            console.log(error);
                            return res.zend(error, 500, "Internal Server Error");
                        }
                        result.existing_repos = result.existing_repos || []
                        if(result.existing_repos.length == 0) return res.zend(repos.repositories);
                        repos.repositories.forEach(repo => {
                            if (!result.existing_repos.some(existingRepo => existingRepo.github_repo_name === repo.full_name)) {
                                final_repos.push(repo);
                            }
                        });
                        return res.zend(final_repos);
                    })
                    
                });
                
            });
        });

    }))

    // integrate github oauth

    // user will create repo on github and add qd app to repo
    
    // save repo url in db, init and push

    router.post('/link-repo-and-push', catchError(async function(req, res) {
        // deployment_git_repo_url
        if(!req.body.subdomain || !req.body.github_repo_name){
            return res.zend(null, 400, "Bad Request");
        }

        req.body.github_repo_name = req.body.github_repo_name.toLowerCase();

        var repo_url = 'https://github.com/' + req.body.github_repo_name + '.git'

        new req.DB({}).execute([
            new req.models.public.git_deployment().insert({
                app_id: new req.models.public.subdomain_gen().select({ app_id: true }).where({
                    name: req.body.subdomain
                }),
                github_repo_name: req.body.github_repo_name,
                github_details: {
                    integrated: true,
                    repo_url: repo_url
                }
            })
          ], function (err, result) {
            if (err) {
                console.log(err);
                return res.zend(err, 500, "Internal Server Error");
            }

            new req.DB({}).execute([
                new req.models.public.users().select({
                    github_ob: true
                }).where({
                    user_id: req.user_id
                }).aggAlias('u')
              ], function (err, result) {
                if (err) {
                    console.log(err);
                    return res.zend(err, 500, "Internal Server Error");
                }

                repoManager.generateRepoFirstTime({
                    subdomain: req.body.subdomain,
                    gitUrl: repo_url,
                    username: 'x-access-token',
                    password: result.u[0].github_ob.token.access_token
                }, function(err){
                    if (err) {
                        console.log(err);
                        return res.zend(err, 500, "Internal Server Error");
                    }
                    res.zend({});
                })

              })

        });

    }));

    // overwrite repo when routes or cors change

    // this is for testing. overwrite will never be called from frontend
    // router.get('/overwrite-repo-test', catchError(async function(req, res) {
    //     if(!req.query.subdomain){
    //         return res.zend(null, 400, "Bad Request");
    //     }
    //     repoManager.overwriteRepo({
    //         subdomain: req.query.subdomain
    //     }).then(function(diff){ 
    //         res.zend({diff});
    //     }).catch(function(err){
    //         console.log(err);
    //         res.zend(err, 500, "Internal Server Error");
    //     })
        
    //     // function(err){
    //     //     if (err) {
    //     //         console.log(err);
    //     //         return res.zend(err, 500, "Internal Server Error");
    //     //     }
    //     //     res.zend({});
    //     // })
    // }));

    // get diff
    router.get('/diff', catchError(async function(req, res) {

        if(!req.query.subdomain){
            return res.zend(null, 400, "Bad Request");
        }

        repoManager.diff({
            subdomain: req.query.subdomain
        }).then(function(diff){ 
            res.zend({diff});
        }).catch(function(err){
            console.log(err);
            if(err.code == 404) return res.zend({});
            res.zend(err, 500, "Internal Server Error");
        })

    }));

    router.get('/diff-verbose', catchError(async function(req, res) {

        if(!req.query.subdomain){
            return res.zend(null, 400, "Bad Request");
        }

        var ob = {
            deleted: [],
            added: [],
            modified: [],
            text: ''
        }

        repoManager.getDiffFiles({
            subdomain: req.query.subdomain
        }).then(function(diff){

            if(diff.deleted.length == 0 && diff.modified.length == 0 && diff.added.length == 0) {
                return res.zend(ob);
            }

            repoManager.readApiIndex({
                subdomain: req.query.subdomain
            }).then(function(content){

                content = JSON.parse(content.replace('module.exports = ', ''));

                if(diff.added.length > 0) {
                    for (let i = 0; i < diff.added.length; i++) {
                        var id = diff.added[i].replace('lib/api/', '').replace('.js', '');
                        var route = queryIdToText({
                            index: content,
                            id: id
                        })
                        ob.added.push(route)
                        ob.text += 'Added: ' + route + '\n'
                    }
                }

                if(diff.modified.length > 0) {
                    for (let i = 0; i < diff.modified.length; i++) {
                        var id = diff.modified[i].replace('lib/api/', '').replace('.js', '');
                        var route = queryIdToText({
                            index: content,
                            id: id
                        })
                        ob.modified.push(route)
                        ob.text += 'Edited: ' + route + '\n'
                    }
                }

                if(diff.deleted.length == 0) {
                    return res.zend(ob)
                }

                // TODO: this is a very shitty way to generate a readable commit message. find workaround

                new req.DB({}).execute([
                    new req.models.public.users().select({
                        github_ob: true
                    }).where({
                        user_id: req.user_id
                    }).aggAlias('u'),
                    new req.models.public.git_deployment().select({github_repo_name: true}).where({
                        app_id: {
                            $inq: new req.models.public.subdomain_gen().select({app_id: true}).where({
                                name: req.query.subdomain
                            })
                        }
                    }).aggAlias('git_d')
                  ], function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.zend(err, 500, "Internal Server Error");
                    }
                    if(!result.u || !result.u[0] || !result.u[0].github_ob || !result.u[0].github_ob.token) return res.zend([]);
                    if(!result.git_d || !result.git_d[0] || !result.git_d[0].github_repo_name) return res.zend([]);
        
                    request({
                        url:  `https://api.github.com/repos/` + result.git_d[0].github_repo_name + '/contents/lib/api-index.js',
                        method: 'GET',
                        headers: {
                            'accept': 'application/vnd.github.raw+json',
                            'Authorization': `Bearer ${result.u[0].github_ob.token.access_token}`,
                            'user-agent': 'node.js'
                        }
                    }, function(error, response, body) {
                        if (error) {
                            console.log(error);
                            return res.zend(error, 500, "Internal Server Error");
                        }
        
                        body = JSON.parse(body.replace('module.exports = ', ''));

                        if(diff.deleted.length > 0) {
                            for (let i = 0; i < diff.deleted.length; i++) {
                                var id = diff.deleted[i].replace('lib/api/', '').replace('.js', '');
                                var route = queryIdToText({
                                    index: body,
                                    id: id
                                })
                                ob.deleted.push(route)
                                ob.text += 'Deleted: ' + route + '\n'
                            }
                        }
    
                        res.zend(ob)
                        
                    });
                });
                
            }).catch(function(err){
                console.log(err);
                res.zend(err, 500, "Internal Server Error");
            })

        }).catch(function(err){
            if(err.code == 404) return res.zend({});
            console.log(err);
            res.zend(err, 500, "Internal Server Error");
        })

    }));

    // commit and push changes
    router.post('/push', catchError(async function(req, res) {

        if(!req.body.subdomain){
            return res.zend(null, 400, "Bad Request");
        }

        repoManager.diff({
            subdomain: req.body.subdomain
        }).then(function(diff){ 

            if(diff.added > 0 || diff.modified > 0 || diff.deleted > 0){

                new req.DB({}).execute([
                    new req.models.public.users().select({
                        github_ob: true
                    }).where({
                        user_id: req.user_id
                    }).aggAlias('u')
                  ], function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.zend(err, 500, "Internal Server Error");
                    }

                    repoManager.push({
                        subdomain: req.body.subdomain,
                        commitMessage: (req.body.commitMessage || diff.text),
                        username: 'x-access-token',
                        password: result.u[0].github_ob.token.access_token
                    }, function(err){
                        if (err) {
                            console.log(err);
                            return res.zend(err, 500, "Internal Server Error");
                        }
                        res.zend({});
                    })

                  })

            } else {
                res.zend({});
            }
            
        }).catch(function(err){
            console.log(err);
            res.zend(err, 500, "Internal Server Error");
        })

    }));

    router.get('/commits', catchError(async function(req, res) {

        if(!req.query.subdomain){
            return res.zend(null, 400, "Bad Request");
        }

        new req.DB({}).execute([
            new req.models.public.users().select({
                github_ob: true
            }).where({
                user_id: req.user_id
            }).aggAlias('u'),
            new req.models.public.git_deployment().select({github_repo_name: true}).where({
                app_id: {
                    $inq: new req.models.public.subdomain_gen().select({app_id: true}).where({
                        name: req.query.subdomain
                    })
                }
            }).aggAlias('git_d')
          ], function (err, result) {
            if (err) {
                console.log(err);
                return res.zend(err, 500, "Internal Server Error");
            }
            if(!result.u || !result.u[0] || !result.u[0].github_ob || !result.u[0].github_ob.token) return res.zend([]);
            if(!result.git_d || !result.git_d[0] || !result.git_d[0].github_repo_name) return res.zend([]);

            request({
                url:  `https://api.github.com/repos/` + result.git_d[0].github_repo_name + '/commits',
                method: 'GET',
                headers: {
                    'accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${result.u[0].github_ob.token.access_token}`,
                    'user-agent': 'node.js'
                }
            }, function(error, response, body) {
                if (error) {
                    console.log(error);
                    return res.zend(error, 500, "Internal Server Error");
                }
                body = JSON.parse(body);

                body = body || []

                var clean_commits = []

                for (let i = 0; i < body.length; i++) {
                    const element = body[i];
                    clean_commits.push({
                        time: body[i].commit.committer.date,
                        message: body[i].commit.message
                    })
                }

                return res.zend(clean_commits)
                
            });
        });

    }));

};

function queryIdToText(params) {

    var routes = Object.keys(params.index)

    for (let i = 0; i < routes.length; i++) {
        var methods = Object.keys(params.index[routes[i]])
        for (let k = 0; k < methods.length; k++) {
            if(params.index[routes[i]][methods[k]] == params.id) return methods[k] + ' ' + routes[i]
        }
    }

}