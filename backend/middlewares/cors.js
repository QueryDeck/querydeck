'use strict';
const net = require('net');
var ModelManager = require('../models/modelManager');

module.exports = function() {

	return function(req, res, next) {

		var host = req.get('host')
    console.log('host = ',host)
		var subdomain = getSubdomainList(host)
		if (subdomain) subdomain = subdomain[0];

		if(ModelManager.domainToSubdomain[host]) {
			subdomain = ModelManager.domainToSubdomain[host];
		}

		var whitelist;
		
		console.log('CORS', subdomain, host)

		if (subdomain && subdomain !== 'api' && subdomain !== 'dev-api' && ModelManager.models[subdomain]) {

			// client api

			var client_cors_whitelist = [];
			ModelManager.models[subdomain].appDetails.cors = ModelManager.models[subdomain].appDetails.cors || []
			for (let i = 0; i < ModelManager.models[subdomain].appDetails.cors.length; i++) {
				const element = ModelManager.models[subdomain].appDetails.cors[i];
				if (element && element != '') client_cors_whitelist.push(element)
			}

			whitelist = client_cors_whitelist;

		} else {

			// platform api

			whitelist = [
				'http://localhost:5051', 'http://localhost:5051/',
				'http://localhost:3000', 'http://localhost:3000/',
				'http://test.localhost:5051', 'http://test.localhost:5051/',
				'http://137.184.29.89', 'http://137.184.29.89/',

				"https://app.querydeck-dev.com", 
				"https://app.querydeck.io", 
				"https://dev.querydeck.io",
				"https://querydeck.io",
				"https://www.querydeck.io"
			]

		}

		var cors = require('cors')({
			origin: whitelist,
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
			maxAge: 3600000
		})

		cors(req, res, next)

	}

};

function getSubdomainList(host) {

	if (host) { 
		// check if host is an ip address
		let subdomain = host.split(':')[0];  //'192.168.1.100:3000'
		if (net.isIPv4(subdomain) || net.isIPv6(subdomain)) return null;
	}
	var subdomainList = host ? host.split('.') : null;
	if (subdomainList)
		subdomainList.splice(-1, 1);
	return subdomainList;
}