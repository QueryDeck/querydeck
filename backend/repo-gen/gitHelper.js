
const git = require('isomorphic-git')
const fs = require("fs/promises");
const http = require('isomorphic-git/http/node')

exports.initRepo = initRepo;
exports.commitAndPush = commitAndPush;
exports.getDiff = getDiff;
exports.cloneRepo = cloneRepo;
exports.removeDeletedFiles = removeDeletedFiles;
exports.getDiffFiles = getDiffFiles;

async function initRepo(params) {

    const directoryName = params.directoryName;

    try {
        await git.init({ fs, dir: directoryName })
    } catch (error) {
        throw error
    }

    try {
        await git.addRemote({
            fs,
            dir: directoryName,
            remote: 'origin',
            url: params.gitUrl,
            defaultBranch: 'main'
        })
    } catch (error) {
        throw error
    }

    try {
        await git.add({ fs, dir: directoryName, filepath: '.'})
    } catch (error) {
        throw error
    }

    try {
        let sha = await git.commit({
            fs,
            dir: directoryName,
            author: {
                    name: 'QueryDeck',
                    email: 'support@querydeck.io',
                },
            message: 'Initial commit'
        })
    } catch (error) {
        throw error
    }

    try {
        let pushResult = await git.push({
            fs,
            http,
            dir: directoryName,
            remote: 'origin',
            // ref: 'main',
            force: true,
            onAuth: url => {
        
                return {
                    username: params.username,
                    password: params.password,
                }
            }
        })
        return pushResult
    } catch (error) {
        error.push_failed = true
        throw error
    }

}

async function removeDeletedFiles(params) {

    let status;
    try {
        status = await git.statusMatrix({
            fs,
            dir: params.directoryName
        })
    } catch (error) {
        throw error
    }

    for(var i = 0; i < status.length; i++) {

        if(status[i][0].indexOf('lib/api/') > -1) {
            if(status[i][1] == 1 && status[i][2] == 1 && status[i][3] == 1) continue;

            if(status[i][1] == 1 && status[i][2] == 0) {
                try {
                    await git.remove({ fs, dir: params.directoryName, filepath: status[i][0]})
                } catch (error) {
                    throw error
                }
            }
        }
    }

}

async function getDiff(params) {

    let status;
    try {
        status = await git.statusMatrix({
            fs,
            dir: params.directoryName
        })
    } catch (error) {
        throw error
    }

    var files = {
        deleted: 0,
        added: 0,
        modified: 0,
        text: 'API changed:\n'
    };

    var change_count = 0;

    for(var i = 0; i < status.length; i++) {

        if(status[i][0].indexOf('lib/api/') > -1) {
            if(status[i][1] == 1 && status[i][2] == 1 && status[i][3] == 1) continue;

            if(status[i][1] == 0) {
                ++change_count;
                ++files.added;
            } else if(status[i][1] == 1 && status[i][2] == 2) {
                ++change_count;
                ++files.modified
            } else if(status[i][1] == 1 && status[i][2] == 0) {
                ++change_count;
                ++files.deleted
            }
        } else if(status[i][0].indexOf('lib/app.js') > -1) {
            if(status[i][1] == 0) {
                files.app_modified = true
            } else if(status[i][1] == 1 && status[i][2] == 2) {
                files.app_modified = true
            }
            
        } else if(status[i][0].indexOf('lib/models.js') > -1) {
            if(status[i][1] == 0) {
                files.models_modified = true
            } else if(status[i][1] == 1 && status[i][2] == 2) {
                files.models_modified = true
            }
        }
    }

    files.text += 'Added: ' + files.added + '\nModified: ' + files.modified + '\nDeleted: ' + files.deleted

    if(files.app_modified) {
        ++change_count;
        files.text = 'App changed\n' + files.text
    }
    
    if(files.models_modified) {
        ++change_count;
        files.text = 'Models changed\n' + files.text
    }

    if(change_count > 0) {
        files.text = change_count + ' changes\n' + files.text
    }

    files.total_changes = change_count;

    return files;

}

async function getDiffFiles(params) {

    let status;
    try {
        status = await git.statusMatrix({
            fs,
            dir: params.directoryName
        })
    } catch (error) {
        throw error
    }

    var files = {
        deleted: [],
        added: [],
        modified: []
    };

    for(var i = 0; i < status.length; i++) {

        if(status[i][0].indexOf('lib/api/') > -1) {
            if(status[i][1] == 1 && status[i][2] == 1 && status[i][3] == 1) continue;

            if(status[i][1] == 0) {
                files.added.push(status[i][0])
            } else if(status[i][1] == 1 && status[i][2] == 2) {
                files.modified.push(status[i][0])
            } else if(status[i][1] == 1 && status[i][2] == 0) {
                files.deleted.push(status[i][0])
            }
        }
    }

    return files;

}

async function commitAndPush(params) {

    const directoryName = params.directoryName;

    var diff = await getDiff({directoryName: directoryName})

    if(diff.added == 0 && diff.modified == 0 && diff.deleted == 0) {
        return {
            status: 'No changes'
        }
    }

    try {
        await git.add({ fs, dir: directoryName, filepath: '.'})
    } catch (error) {
        throw error
    }

    try {
        let sha = await git.commit({
            fs,
            dir: directoryName,
            author: {
                    name: 'QueryDeck',
                    email: 'support@querydeck.io',
                },
            message: params.commitMessage
        })
    } catch (error) {
        throw error
    }

    try {
        let pushResult = await git.push({
            fs,
            http,
            dir: directoryName,
            remote: 'origin',
            // ref: 'main',
            // force: true,
            onAuth: url => {
        
                return {
                    username: params.username,
                    password: params.password,
                }
            }
        })
        return pushResult
    } catch (error) {
        throw error
    }

}

async function cloneRepo(params) {
    
    if(!params.gitUrl) {
        throw {error: '!params.gitUrl'}
    }

    if(!params.directoryName) {
        throw {error: '!params.directoryName'}
    }

    if(!params.username) {
        throw {error: '!params.username'}
    }

    if(!params.password) {
        throw {error: '!params.password'}
    }

    try {
        let cloneResult = await git.clone({
            fs,
            http,
            dir: params.directoryName,
            remote: 'origin',
            url: params.gitUrl,
            singleBranch: true,
            depth: 1,
            onAuth: url => {
        
                return {
                    username: params.username,
                    password: params.password,
                }
            }
        })
        return cloneResult
    } catch (error) {
        throw error
    }

}