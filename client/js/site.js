(function() {
	var captureIntervalDelay = 100;
	var captureWidth = 320;
	var captureHeight = 240;
	var diffWidth = 32;
	var diffHeight = 24;
	var diffThreshold = 128;

	var streamVideo, motionImage, captureCanvas, captureContext, diffCanvas, diffContext;
	var captureInterval;
	var captures = [];
	var capturesCount = 2;

	function init() {
		streamVideo = document.getElementById('stream');
		motionImage = document.getElementById('motion');

		captureCanvas = document.createElement('canvas');
		captureCanvas.width = captureWidth;
		captureCanvas.height = captureHeight;
		captureContext = captureCanvas.getContext('2d');

		diffCanvas = document.createElement('canvas');
		diffCanvas.width = diffWidth;
		diffCanvas.height = diffHeight;
		diffContext = diffCanvas.getContext('2d');
		diffContext.globalCompositeOperation = 'difference';

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
		startCapturing();
	}

	function displayError(error) {
		console.log(error);
	}

	function startCapturing() {
		captureInterval = self.setInterval(getCapture, captureIntervalDelay);
	}

	function getCapture() {
		captureContext.drawImage(streamVideo, 0, 0, captureWidth, captureHeight);

		var newImage = new Image();
		newImage.onload = saveCapture;
		newImage.src = captureCanvas.toDataURL('image/png');
	}

	function saveCapture() {
		captures.unshift(this);
		captures.length = capturesCount; // TODO: fix truncating with undefined

		var oldImage = captures[captures.length - 1];
		var result = checkDiff(oldImage, this);
		console.log(result);
		motionImage.src = result.diffDataURL;
	}

	function checkDiff(oldImage, newImage) {
		diffContext.clearRect(0, 0, diffWidth, diffHeight);
		diffContext.drawImage(oldImage, 0, 0, diffWidth, diffHeight);
		diffContext.drawImage(newImage, 0, 0, diffWidth, diffHeight);

		var diffImgData = diffContext.getImageData(0, 0, diffWidth, diffHeight);
		var rgba = diffImgData.data;

		var thresholdCount = 0;
		var diffAverage = 0;
		for (var i = 0; i < rgba.length; i += 4) {
			var diff = rgba[i] * 0.3 + rgba[i + 1] * 0.6 + rgba[i + 2] * 0.1;
			rgba[i] = 0;
			rgba[i + 1] = diff;
			rgba[i + 2] = 0;

			if (diff >= diffThreshold) {
				thresholdCount++;
			}
			diffAverage += diff;
		}
		diffAverage /= rgba.length / 4;

		// TODO: if I have to redraw on a canvas anyway, change motion back to canvas?
		diffContext.clearRect(0, 0, diffWidth, diffHeight);
		diffContext.putImageData(diffImgData, 0, 0);

		return {
			diffDataURL: diffCanvas.toDataURL(),
			thresholdCount: thresholdCount,
			diffAverage: diffAverage
		};
	}

	init();
})();