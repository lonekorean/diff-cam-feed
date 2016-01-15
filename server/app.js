var bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');

if (!process.env.ENVIRONMENT) {
	var env = require('../../env.js');
}

var app = express();
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));

app.use(express.static('./dist/client'));

app.post('/upload', function(req, res) {
	console.dir(req.body);
});

var server = app.listen(3000, function() {
	console.log('Listening...');
});
