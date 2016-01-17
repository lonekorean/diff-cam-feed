var express = require('express');
var twitter = require('twitter');

var router = express.Router();

router.post('/', function(req, res) {
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

module.exports = router;
