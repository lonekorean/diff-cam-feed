(function() {
	var captureIntervalDelay = 100;
	var captureWidth = 320;
	var captureHeight = 240;
	var diffWidth = 32;
	var diffHeight = 24;
	var diffThreshold = 32;
	var diffSpan = 2;

	var verdict, streamVideo, captureCanvas, captureContext, diffCanvas, diffContext, motionCanvas, motionContext;
	var captureInterval;
	var captures = [];

	function init() {
		verdict = document.getElementById('verdict');
		streamVideo = document.getElementById('stream');

		captureCanvas = document.createElement('canvas');
		captureCanvas.width = captureWidth;
		captureCanvas.height = captureHeight;
		captureContext = captureCanvas.getContext('2d');

		diffCanvas = document.createElement('canvas');
		diffCanvas.width = diffWidth;
		diffCanvas.height = diffHeight;
		diffContext = diffCanvas.getContext('2d');
		diffContext.globalCompositeOperation = 'difference';

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
		captures = captures.slice(0, diffSpan);

		var oldImage = captures[captures.length - 1];
		var diff = checkDiff(oldImage, this);
		verdict.textContent = diff.thresholdCount >= 5 ? 'yes' : 'no';
		motionContext.putImageData(diff.imgData, 0, 0);
	}

	function checkDiff(oldImage, newImage) {
		diffContext.clearRect(0, 0, diffWidth, diffHeight);
		diffContext.drawImage(oldImage, 0, 0, diffWidth, diffHeight);
		diffContext.drawImage(newImage, 0, 0, diffWidth, diffHeight);

		var imgData = diffContext.getImageData(0, 0, diffWidth, diffHeight);
		var rgba = imgData.data;

		var thresholdCount = 0;
		var diffAverage = 0;
		for (var i = 0; i < rgba.length; i += 4) {
			var diff = rgba[i] * 0.3 + rgba[i + 1] * 0.6 + rgba[i + 2] * 0.1;
			var lit = Math.min(255, diff * (255 / diffThreshold));
			rgba[i] = 0;
			rgba[i + 1] = lit;
			rgba[i + 2] = 0;

			if (diff >= diffThreshold) {
				thresholdCount++;
			}
			diffAverage += diff;
		}
		diffAverage /= rgba.length / 4;

		return {
			imgData: imgData,
			thresholdCount: thresholdCount,
			diffAverage: diffAverage
		};
	}

	init();
})();