var bodyParser = require('body-parser');
var express = require('express');

module.exports = function(app) {
	app.use(bodyParser.json({ limit: '2mb' }));
	app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));

	app.use(express.static('./dist/client'));

	app.use('/upload', require('./routes/upload'));
};
