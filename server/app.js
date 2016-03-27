var express = require('express');

if (process.env.ENVIRONMENT !== 'prod') {
	try {
		// attempt to load dev .env file
		require('../../.env');
	} catch (e) {
		throw 'Environment variables not found. If in dev, make sure your .env file is in place. If in prod, make sure you have properly configured your environment variables.';
	}
}

var app = express();
var router = require('./router')(app);

var server = app.listen(3000, function() {
	console.log('Listening...');
});
