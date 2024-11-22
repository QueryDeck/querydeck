'use strict';

const appDetails = require.main.require('./lib/app.js');

module.exports = function() {

	return function(req, res, next) {

		var whitelist = []

		appDetails.cors = appDetails.cors || []
		for (let i = 0; i < appDetails.cors.length; i++) {
			const element = appDetails.cors[i];
			if (element && element != '') whitelist.push(element)
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