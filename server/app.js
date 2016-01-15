var bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');
var twitter = require('twitter');

if (!process.env.ENVIRONMENT) {
	var env = require('../../env.js');
}

var app = express();
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));

app.use(express.static('./dist/client'));

app.post('/upload', function(req, res) {
	var client = new twitter({
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
		access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
	});

	var mediaUpload = {
		media_data: req.body.dataURL
	};
	client.post('media/upload', mediaUpload, function(error, media, response) {
		if (error) {
			console.log('Error uploading media:', error);
		} else {
			var statusUpdate = {
				status: 'Score: ' + req.body.score,
				media_ids: media.media_id_string
			};
			client.post('statuses/update', statusUpdate, function(error, tweet, response) {
				if (error) {
					console.log('Error updating status:', error);
				} else {
					console.log('Capture uploaded');
				}
			});
		}
	});
});

var server = app.listen(3000, function() {
	console.log('Listening...');
});
