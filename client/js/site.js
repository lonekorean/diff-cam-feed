var diffCanvas;
var diffContext;
var captureInterval;
var captures = [];

$(function() {
	diffCanvas = $('.diff')[0];
	diffContext = diffCanvas.getContext('2d');

	drawImages();

	requestCam();

	startCaptures();
});

function drawImages() {
}

function requestCam() {
	var video = $('video')[0];

	var promise = navigator.mediaDevices.getUserMedia({
		audio: false,
		video: true
	});

	promise
		.then(function(stream) {
			video.srcObject = stream;
		})
		.catch(function(error) {
			console.log(error);
		});
}

function startCaptures() {
	var captureInterval = self.setInterval(capture, 100);
}

function capture() {
	var video = $('video')[0];
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');

	canvas.width = 320;
	canvas.height = 240;
	context.drawImage(video, 0, 0, canvas.width, canvas.height);

	var data = canvas.toDataURL('image/png');
	captures.unshift(data);
	captures.length = 2;

	$('.capture1').attr('src', captures[0]);
	$('.capture2').attr('src', captures[1]);

	// TODO: sloppy copy/paste, clean up
	img1 = new Image();
	img1.onload = function() {
		img2 = new Image();
		img2.onload = function() {
			var result = self.dc.imageDiff.diff(img1, img2, {
				width: 32,
				height: 24,
				threshold: 128
			});
			diffCanvas.width = 32;
			diffCanvas.height = 24;
			diffContext.putImageData(result.imgData, 0, 0);
			$('.movement').text(result.diffAverage > 5 ? 'Moving!' : 'Still...');
			console.log(result.diffAverage);
		};
		img2.src = captures[1];
	};
	img1.src = captures[0];
}
