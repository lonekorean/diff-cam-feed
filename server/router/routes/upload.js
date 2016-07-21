var express = require('express');
var twitter = require('twitter');

var router = express.Router();

router.post('/', function(req, res) {
	var client = new twitter({
		consumer_key: global.config.TWITTER_CONSUMER_KEY,
		consumer_secret: global.config.TWITTER_CONSUMER_SECRET,
		access_token_key: req.user.tokenKey,
		access_token_secret: req.user.tokenSecret
	});

	if (req.body.isTestMode === 'true') {
		console.log('Success (test mode)');
		res.status(200).send();
	} else {
		var mediaUpload = {
			media_data: req.body.dataURL
		};
		client.post('media/upload', mediaUpload, function(error, media, response) {
			if (error) {
				console.log('Error uploading media:', error);
			} else {
				var statusUpdate = {
					status: 'Motion score: ' + req.body.score + ' #diffcam',
					media_ids: media.media_id_string
				};
				client.post('statuses/update', statusUpdate, function(error, tweet, response) {
					if (error) {
						console.log('Error updating status:', error);
						res.status(500).send({ error: error });
					} else {
						console.log('Status update successful');
						res.status(200).send();
					}
				});
			}
		});
	}
});

module.exports = router;
