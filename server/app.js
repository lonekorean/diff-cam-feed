var express = require('express');

require('../../config.js');

var app = express();
var router = require('./router')(app);

var server = app.listen(global.config.PORT, function() {
	console.log('Listening...');
});
