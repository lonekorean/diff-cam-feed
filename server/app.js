var express = require('express');

if (!process.env.ENVIRONMENT) {
	require('../../env.js');
}

var app = express();
var router = require('./router')(app);

var server = app.listen(3000, function() {
	console.log('Listening...');
});
