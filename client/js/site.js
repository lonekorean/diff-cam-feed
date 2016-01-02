(function() {
	// config
	var captureIntervalDelay = 100;	// time between captures, in ms
	var captureWindow = 2000;		// time to consider best capture, in ms
	var captureCooldown = 8000;		// time to chill after saving capture, in ms
	var captureWidth = 320;
	var captureHeight = 240;
	var diffWidth = 32;
	var diffHeight = 24;
	var pixelDiffThreshold = 32;	// min for a pixel to be considered different
	var scoreThreshold = 4;			// min for an image to be considered different

	// shared
	var isCaptureWindow;			// currently within a capture time window?
	var isCaptureCooldown;			// currently taking a break from capturing?
	var captureInterval;			// set interval for capturing
	var oldImage;					// previous captured image to compare against
	var bestDiff;					// most significant diff during a capture window

	// reused elements and canvas contexts
	var verdict, streamVideo, captureCanvas, captureContext, diffCanvas, diffContext,
		motionCanvas, motionContext;

	function init() {
		// cache some elements
		verdict = document.getElementById('verdict');
		streamVideo = document.getElementById('stream');

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
		motionCanvas = document.getElementById('motion');
		motionCanvas.width = diffWidth;
		motionCanvas.height = diffHeight;
		motionContext = motionCanvas.getContext('2d');		

		requestCam();
	}

	function requestCam() {
		var constraints = {
			audio: false,
			video: { width: captureWidth, height: captureHeight }
		};

		navigator.mediaDevices.getUserMedia(constraints)
			.then(startStreamingVideo)
			.catch(displayError);
	}

	function startStreamingVideo(stream) {
		streamVideo.srcObject = stream;
		captureInterval = self.setInterval(getCapture, captureIntervalDelay);
	}

	function displayError(error) {
		console.log(error);
	}

	function getCapture() {
		// capture from video
		captureContext.drawImage(streamVideo, 0, 0, captureWidth, captureHeight);

		// create as image
		var newImage = new Image();
		newImage.onload = saveCapture;
		newImage.src = captureCanvas.toDataURL();
	}

	function saveCapture() {
		var newImage = this;
		if (oldImage) {
			var diff = calculateDiff(oldImage, newImage);

			// show motion on page
			motionContext.putImageData(diff.diffImgData, 0, 0);

			if (!isCaptureCooldown) {
				if (isCaptureWindow) {
					if (diff.score > bestDiff.score) {
						// this is our new best diff for this capture window
						bestDiff = diff;
					}
				} else {
					if (diff.score > scoreThreshold) {
						// this capture is good enough to start a new capture window
						bestDiff = diff;
						isCaptureWindow = true;
						setTimeout(endCaptureWindow, captureWindow);
					}
				}
			}
		}

		oldImage = newImage;
	}

	function calculateDiff(oldImage, newImage) {
		// clear canvas and draw both images
		diffContext.clearRect(0, 0, diffWidth, diffHeight);
		diffContext.drawImage(oldImage, 0, 0, diffWidth, diffHeight);
		diffContext.drawImage(newImage, 0, 0, diffWidth, diffHeight);

		var diffImgData = diffContext.getImageData(0, 0, diffWidth, diffHeight);
		var rgba = diffImgData.data;

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
			newimage: newImage,
			diffImgData: diffImgData,
			score: score
		};
	}

	function checkScore() {

	}

	function endCaptureWindow() {
		upload();

		isCaptureWindow = false;
		bestDiff = undefined;

		isCaptureCooldown = true;
		setTimeout(endCaptureCooldown, captureCooldown);
	}

	function endCaptureCooldown() {
		isCaptureCooldown = false;
	}

	function upload() {
		console.log('This is when uploading would happen...');
	}

	// kick things off
	init();
})();