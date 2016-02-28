var DiffCamEngine = (function() {
	var video;
	var captureCanvas;			// internal canvas for capturing images from video
	var diffCanvas;				// internal canvas for diffing captured images
	var motionCanvas;

	var startSuccessCallback;	// called when streaming starts
	var startErrorCallback;		// called when getUserMedia() fails
	var captureCallback;		// called when an image has been captured and diffed

	var oldImage;				// previously captured image to compare against
	var captureInterval;
	var captureIntervalTime;	// time between captures, in ms
	var captureWidth;
	var captureHeight;
	var diffWidth;
	var diffHeight;
	var pixelDiffThreshold;		// min for a pixel to be considered significant

	function init(options) {
		// sanity check
		if (!options) {
			throw 'No options object provided';
		}

		// incoming options with defaults
		video = options.video || document.createElement('video');
		motionCanvas = options.motionCanvas || document.createElement('canvas');
		captureIntervalTime = options.captureIntervalTime || 100;
		captureWidth = options.captureWidth || 640;
		captureHeight = options.captureHeight || 480;
		diffWidth = options.diffWidth || 64;
		diffHeight = options.diffHeight || 48;
		pixelDiffThreshold = options.pixelDiffThreshold || 32;

		// callbacks
		startSuccessCallback = options.startSuccessCallback || function() {};
		startErrorCallback = options.startErrorCallback || function() {};
		captureCallback = options.captureCallback || function() {};

		// non-configurable
		captureCanvas = document.createElement('canvas');
		diffCanvas = document.createElement('canvas');
		oldImage = undefined;

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

	function start() {
		var constraints = {
			audio: false,
			video: { width: captureWidth, height: captureHeight }
		};

		navigator.mediaDevices.getUserMedia(constraints)
			.then(startSuccess)
			.catch(startError);
	}

	function startSuccess(stream) {
		// good to go, but streaming still takes a moment to start
		video.addEventListener('canplay', startComplete);
		video.srcObject = stream;
	}

	function startComplete() {
		// clean up the event listener
		video.removeEventListener('canplay', startComplete);

		captureInterval = setInterval(capture, captureIntervalTime);
		startSuccessCallback();
	}

	function startError(error) {
		console.log(error);
		startErrorCallback();
	}

	function stop() {
		clearInterval(captureInterval);
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

		// safety check (may have stopped streaming during image load)
		if (video.paused) {
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

	function getPixelDiffThreshold() {
		return pixelDiffThreshold;
	}

	function setPixelDiffThreshold(val) {
		pixelDiffThreshold = val;
	}

	return {
		// public getters/setters
		getPixelDiffThreshold: getPixelDiffThreshold,
		setPixelDiffThreshold: setPixelDiffThreshold,

		// public functions
		init: init,
		start: start,
		stop: stop
	};
})();
