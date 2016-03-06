var DiffCamEngine = (function() {
	var stream;					// stream obtained from webcam
	var video;					// shows stream
	var captureCanvas;			// internal canvas for capturing full images from video
	var diffCanvas;				// internal canvas for diffing downscaled captures
	var motionCanvas;			// receives processed diff images

	var initSuccessCallback;	// called when init succeeds
	var initErrorCallback;		// called when init fails
	var startCompleteCallback;	// called when start is complete
	var captureCallback;		// called when an image has been captured and diffed

	var captureInterval;		// interval for continuous captures
	var captureIntervalTime;	// time between captures, in ms
	var captureWidth;			// full captured image width
	var captureHeight;			// full captured image height
	var diffWidth;				// downscaled width for diff/motion
	var diffHeight;				// downscaled height for diff/motion
	var isReadyToDiff;			// has a previous capture been made to diff against?
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
		initSuccessCallback = options.initSuccessCallback || function() {};
		initErrorCallback = options.initErrorCallback || function() {};
		startCompleteCallback = options.startCompleteCallback || function() {};
		captureCallback = options.captureCallback || function() {};

		// non-configurable
		captureCanvas = document.createElement('canvas');
		diffCanvas = document.createElement('canvas');
		isReadyToDiff = false;

		// prep capture canvas
		captureCanvas.width = captureWidth;
		captureCanvas.height = captureHeight;
		captureContext = captureCanvas.getContext('2d');

		// prep diff canvas
		diffCanvas.width = diffWidth;
		diffCanvas.height = diffHeight;
		diffContext = diffCanvas.getContext('2d');

		// prep motion canvas
		motionCanvas.width = diffWidth;
		motionCanvas.height = diffHeight;
		motionContext = motionCanvas.getContext('2d');

		requestWebcam();
	}

	function requestWebcam() {
		var constraints = {
			audio: false,
			video: { width: captureWidth, height: captureHeight }
		};

		navigator.mediaDevices.getUserMedia(constraints)
			.then(initSuccess)
			.catch(initError);
	}

	function initSuccess(requestedStream) {
		stream = requestedStream;
		initSuccessCallback();
	}

	function initError(error) {
		console.log(error);
		initErrorCallback();
	}

	function start() {
		// streaming takes a moment to start
		video.addEventListener('canplay', startComplete);
		video.srcObject = stream;
	}

	function startComplete() {
		video.removeEventListener('canplay', startComplete);
		captureInterval = setInterval(capture, captureIntervalTime);
		startCompleteCallback();
	}

	function stop() {
		clearInterval(captureInterval);
		video.src = '';
		motionContext.clearRect(0, 0, diffWidth, diffHeight);
		isReadyToDiff = false;
	}

	function capture() {
		// save a full-sized copy of capture
		captureContext.drawImage(video, 0, 0, captureWidth, captureHeight);
		captureImageData = captureContext.getImageData(0, 0, captureWidth, captureHeight);

		// diff current capture over previous capture, leftover from last time
		diffContext.globalCompositeOperation = 'difference';
		diffContext.drawImage(video, 0, 0, diffWidth, diffHeight);
		diffImageData = diffContext.getImageData(0, 0, diffWidth, diffHeight);

		if (isReadyToDiff) {
			var score = processDiff(diffImageData);
			motionContext.putImageData(diffImageData, 0, 0);
			captureCallback({
				imageData: captureImageData,
				score: score,
				getURL: getCaptureUrl.bind(null, captureImageData)
			});
		}

		// draw current capture normally over diff, ready for next time
		diffContext.globalCompositeOperation = 'source-over';
		diffContext.drawImage(video, 0, 0, diffWidth, diffHeight);
		isReadyToDiff = true;
	}

	function processDiff(diffImageData) {
		var rgba = diffImageData.data;

		// pixel adjustments are done by reference directly on diffImageData
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

		return score;
	}

	function getCaptureUrl(captureImageData) {
		// may as well borrow captureCanvas
		captureContext.putImageData(captureImageData, 0, 0);
		return captureCanvas.toDataURL();
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
