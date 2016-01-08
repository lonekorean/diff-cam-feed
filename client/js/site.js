$(function() {
	// config
	var captureIntervalTime = 100;	// time between captures, in ms
	var considerTime = 2000;		// time window to consider best capture, in ms
	var chillTime = 2000;			// time to chill after committing, in ms
	var captureWidth = 640;
	var captureHeight = 480;
	var diffWidth = 64;
	var diffHeight = 48;
	var pixelDiffThreshold = 16;	// min for a pixel to be considered significant
	var scoreThreshold = 4;			// min for an image to be considered significant

	// shared
	var captureInterval;
	var stopConsideringTimeout;
	var stopChillingTimeout;
	var status = 'disabled';		// disabled, watching, considering, chilling
	var oldImage;					// previous captured image to compare against
	var bestDiff;					// most significant diff while considering

	var video, captureCanvas, captureContext, diffCanvas, diffContext,
		motionCanvas, motionContext;

	var $toggle = $('.toggle');
	var $history = $('.history');

	var $historyItemTemplate = $('#history-item-template');

	function init() {
		video = $('.video')[0];

		// create canvas for captures in memory
		captureCanvas = document.createElement('canvas');
		captureCanvas.width = captureWidth;
		captureCanvas.height = captureHeight;
		captureContext = captureCanvas.getContext('2d');

		// create canvas for diffing in memory
		diffCanvas = document.createElement('canvas');
		diffCanvas.width = diffWidth;
		diffCanvas.height = diffHeight;
		diffContext = diffCanvas.getContext('2d');
		diffContext.globalCompositeOperation = 'difference';

		// set up canvas on page for showing motion
		motionCanvas = $('.motion')[0];
		motionCanvas.width = diffWidth;
		motionCanvas.height = diffHeight;
		motionContext = motionCanvas.getContext('2d');

		$toggle.on('click', toggleStreaming);
	}

	function toggleStreaming() {
		if (status === 'disabled') {
			requestCam();
		} else {
			stopStreaming();
		}
	}

	function requestCam() {
		var constraints = {
			audio: false,
			video: { width: captureWidth, height: captureHeight }
		};

		navigator.mediaDevices.getUserMedia(constraints)
			.then(startStreaming)
			.catch(displayError);
	}

	function startStreaming(stream) {
		status = 'watching';
		video.srcObject = stream;
		captureInterval = setInterval(capture, captureIntervalTime);
		$toggle.text('Stop');
	}

	function stopStreaming() {
		// kill time-delayed actions
		clearInterval(captureInterval);
		clearTimeout(stopConsideringTimeout);
		clearTimeout(stopChillingTimeout);
		status = 'disabled';
		bestDiff = undefined;

		video.srcObject.getVideoTracks()[0].stop();
		$toggle.text('Start');
	}

	function displayError(error) {
		console.log(error);
		$toggle
			.text('Denied')
			.prop('disabled', true);
	}

	function capture() {
		// capture from video
		captureContext.drawImage(video, 0, 0, captureWidth, captureHeight);

		// create as image
		var newImage = new Image();
		newImage.onload = checkImage;
		newImage.src = captureCanvas.toDataURL();
	}

	function checkImage() {
		// safety check (user could stop stream during image load)
		if (status !== 'disabled') {
			var newImage = this;
			if (oldImage) {
				var diff = calculateDiff(oldImage, newImage);

				// show motion on page
				motionContext.putImageData(diff.imageData, 0, 0);

				if (status === 'watching' && diff.score > scoreThreshold) {
					// this diff is good enough to start a consideration time window
					status = 'considering';
					bestDiff = diff;
					stopConsideringTimeout = setTimeout(stopConsidering, considerTime);
				} else if (status === 'considering' && diff.score > bestDiff.score) {
					// this is the new best diff for this consideration time window
					bestDiff = diff;
				}
			}
			oldImage = newImage;
		}
	}

	function calculateDiff(oldImage, newImage) {
		// clear canvas and draw both images
		diffContext.clearRect(0, 0, diffWidth, diffHeight);
		diffContext.drawImage(oldImage, 0, 0, diffWidth, diffHeight);
		diffContext.drawImage(newImage, 0, 0, diffWidth, diffHeight);

		// get pixel data
		var imageData = diffContext.getImageData(0, 0, diffWidth, diffHeight);
		var rgba = imageData.data;

		// score each pixel, adjust color for display
		var score = 0;
		for (var i = 0; i < rgba.length; i += 4) {
			var pixelDiff = rgba[i] * 0.3 + rgba[i + 1] * 0.6 + rgba[i + 2] * 0.1;
			var normalized = Math.min(255, pixelDiff * (255 / pixelDiffThreshold));
			rgba[i] = 0;
			rgba[i + 1] = normalized;
			rgba[i + 2] = 0;

			if (pixelDiff >= pixelDiffThreshold) {
				score++;
			}
		}

		return {
			newImage: newImage,
			imageData: imageData,
			score: score
		};
	}

	function stopConsidering() {
		commit(bestDiff);
		bestDiff = undefined;

		status = 'chilling';
		stopChillingTimeout = setTimeout(stopChilling, chillTime);
	}

	function stopChilling() {
		status = 'watching';
	}

	function commit(diff) {
		// prep values
		var src = diff.newImage.src;
		var time = new Date().toLocaleTimeString();
		var caption = time.toLowerCase() + ' (score: ' + diff.score + ')';

		// load html from template
		var html = $historyItemTemplate.html();
		var $newHistoryItem = $(html);

		// set values and add to page
		$newHistoryItem.find('img').attr('src', src);
		$newHistoryItem.find('figcaption').text(caption);
		$history.prepend($newHistoryItem);

		// TODO: and then upload
	}

	// kick things off
	init();
});
