var bodyParser = require('body-parser');
var express = require('express');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./dist/client'));

app.post('/upload', function(req, res) {
	console.dir(req.body);
	res.send('POST request to the homepage');
});

var server = app.listen(3000, function() {
	console.log('Listening...');
});
