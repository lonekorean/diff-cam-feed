var DiffCamEngine = (function() {
	var isStreaming;
	var captureCanvas;
	var diffCanvas;
	var captureInterval;
	var oldImage;				// previously captured image to compare against
	var video;
	var motionCanvas;
	var captureIntervalTime;	// time between captures, in ms
	var captureWidth;
	var captureHeight;
	var diffWidth;
	var diffHeight;
	var pixelDiffThreshold;		// min for a pixel to be considered significant
	var scoreThreshold;			// min for an image to be considered significant
	var captureCallback;

	function init(options) {
		// sanity check
		if (!options) {
			throw 'No options object provided';
		}

		// non-configurable
		isStreaming = false;
		captureCanvas = document.createElement('canvas');
		diffCanvas = document.createElement('canvas');

		// incoming options with default
		video = options.video || document.createElement('video');
		motionCanvas = options.motionCanvas || document.createElement('canvas');
		captureIntervalTime = options.captureIntervalTime || 100;
		captureWidth = options.captureWidth || 640;
		captureHeight = options.captureHeight || 480;
		diffWidth = options.diffWidth || 64;
		diffHeight = options.diffHeight || 48;
		pixelDiffThreshold = options.pixelDiffThreshold || 32;
		scoreThreshold = options.scoreThreshold || 8;

		startCallback = options.startCallback || function() {};
		errorCallback = options.errorCallback || function() {};
		captureCallback = options.captureCallback || function() {};

		// prep capture canvas
		captureCanvas.width = captureWidth;
		captureCanvas.height = captureHeight;
		captureContext = captureCanvas.getContext('2d');

		// prep diff canvas
		diffCanvas.width = diffWidth;
		diffCanvas.height = diffHeight;
		diffContext = diffCanvas.getContext('2d');
		diffContext.globalCompositeOperation = 'difference';

		// prep motion canvas
		motionCanvas.width = diffWidth;
		motionCanvas.height = diffHeight;
		motionContext = motionCanvas.getContext('2d');
	}

	function requestCam() {
		var constraints = {
			audio: false,
			video: { width: captureWidth, height: captureHeight }
		};

		navigator.mediaDevices.getUserMedia(constraints)
			.then(startStreaming)
			.catch(errorCallback);
	}

	function displayError(error) {
		console.log(error);
	}

	function startStreaming(stream) {
		isStreaming = true;
		video.srcObject = stream;
		captureInterval = setInterval(capture, captureIntervalTime);

		startCallback();
	}

	function stopStreaming() {
		clearInterval(captureInterval);
		isStreaming = false;

		video.srcObject.getVideoTracks()[0].stop();
		video.src = '';
		motionContext.clearRect(0, 0, diffWidth, diffHeight);
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
		var newImage = this;
		newImage.onload = null;

		// safety check (stream may have stopped during image load)
		if (!isStreaming) {
			return;
		}

		if (oldImage) {
			var diff = calculateDiff(oldImage, newImage);
			motionContext.putImageData(diff.imageData, 0, 0);
			captureCallback(diff);

			// fixes nasty memory leak
			oldImage.src = '';
		}

		oldImage = newImage;
		captureCallback();
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
			newImageSrc: newImage.src,
			imageData: imageData,
			score: score
		};
	}

	return {
		getPixelDiffThreshold: function() { return pixelDiffThreshold; },
		setPixelDiffThreshold: function(val) { pixelDiffThreshold = val; },

		getScoreThreshold: function() { return scoreThreshold; },
		setScoreThreshold: function(val) { scoreThreshold = val; },

		// public functions
		init: init,
		requestCam: requestCam,
		stopStreaming: stopStreaming
	};
})();
