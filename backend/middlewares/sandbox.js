'use strict';

var allModels = require.main.require('./models/modelManager').models;

module.exports = function() {

	return function(req, res, next) {

		return next()

		var subdomain = getSubdomainList(req.get('host'))
		if (subdomain) subdomain = subdomain[0];

		if (subdomain && subdomain !== 'api' && subdomain !== 'dev-api' && allModels[subdomain] && subdomain == 'sandbox' && req.session.user && req.session.user.sandbox && ['POST', 'PUT', 'DELETE'].indexOf(req.method) > -1) {

			if(req.originalUrl.indexOf('controllers/sql-gen') > -1) {

				next()

			} else {

				return res.zend(null, 401, "Not available in Sandbox!");

			}

		} else {
			next()
		}

	}

};

function getSubdomainList(host) {
	var subdomainList = host ? host.split('.') : null;
	if (subdomainList)
		subdomainList.splice(-1, 1);
	return subdomainList;
}