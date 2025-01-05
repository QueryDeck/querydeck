var jwt = require('jsonwebtoken');
var executeClientRequest = require.main.require('./models/executeClientRequest.js').executeClientRequest;

exports.handleRequest = handleRequest;

function handleRequest(params, callback) {

    var request_path = params.request_path;

    var request_method = params.request_method;

    var request_body = params.request_body;

    var request_params = params.request_params;

    var request_headers = params.request_headers;

    var request_cookies = params.request_cookies;

    var currentModel = params.currentModel;

    var path_split = [];
    var orig_path_spl = request_path.split('/')

    for (let i = 0; i < orig_path_spl.length; i++) {
        const element = orig_path_spl[i];
        if(element == '') continue;
        path_split.push(element)
    }

    request_path = '/' + path_split.join('/');

    if(request_path == '/graphql' && request_method == 'POST') {
        if(!request_body.query) {
            return callback({
                response_code: 400,
                error: 'query is required'
            });
        }

        var session = getSession({
            jwt_key: currentModel.appDetails.auth.jwt_key,
            token_header: currentModel.appDetails.auth.token_header,
            request_headers: request_headers,
            request_cookies: request_cookies
        });

        if(session.error) return callback({
            response_code: session.response_code,
            error: session.error
        });

        executeClientRequest({
            auth: currentModel.appDetails.auth,
            request: {
                session: session
            },
            currentModel: currentModel,
            graphql: {
                query: request_body.query,
                variables: request_body.variables
            }
        }, callback);
    } else {

        var query_model;

        var url_param_value;

        if(!currentModel.routes[request_path] || !currentModel.routes[request_path][request_method]) {
            // check for url param
            var partial_url = path_split.slice(0, path_split.length - 1).join('/')
            partial_url = partial_url +  '/:';
            var all_paths = Object.keys(currentModel.routes)
            for (let i = 0; i < all_paths.length; i++) {
                const element = all_paths[i];
                if(element.indexOf(partial_url) > -1 && currentModel.routes[element] && currentModel.routes[element][request_method]) {
                    query_model = JSON.parse(JSON.stringify(currentModel.routes[element][request_method]));
                    url_param_value = path_split[path_split.length - 1];
                    break;
                }
            }
        } else {
            query_model = JSON.parse(JSON.stringify(currentModel.routes[request_path][request_method]));
        }

        if(!query_model){
            return callback({
                response_code: 404,
                error: "Invalid route"
            });
        }

        var session;

        if(query_model.auth_required) {
            session = getSession({
                jwt_key: currentModel.appDetails.auth.jwt_key,
                token_header: currentModel.appDetails.auth.token_header,
                request_headers: request_headers,
                request_cookies: request_cookies
            });

            if(session.error) return callback({
                response_code: session.response_code,
                error: session.error
            });
        }

        executeClientRequest({
            auth: currentModel.appDetails.auth,
            request: {
                session: session,
                body: request_body,
                query: request_params,
                url_param_value: url_param_value
            },
            currentModel: currentModel,
            query_model: query_model
        }, callback);

    }

}

// returns session object or error
function getSession(params) {
    
    var jwt_key = params.jwt_key;

    if(!jwt_key) return {error: 'Auth not setup correctly', response_code: 500};

    var authorization = params.request_headers[params.token_header];

    if(!authorization) {
        if(params.request_cookies[params.token_header]) authorization = params.request_cookies[params.token_header];
    }

    if(!authorization) return {error: 'Login required', response_code: 403};

    var session;
    try {
        session = jwt.verify(authorization, jwt_key, {
            ignoreExpiration: true,
            algorithm: params.jwt_type
        });
    } catch (error) {
        return {error: 'Login required', response_code: 403};
    }

    return session;
}