var express = require('express');
var app = express();

app.use(express.static('public'));

var server = app.listen(3000, function () {
	console.log('Listening...');
});
