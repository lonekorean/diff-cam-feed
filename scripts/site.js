var diffCanvas;
var diffContext;

$(function() {
	diffCanvas = $('.diff')[0];
	diffContext = diffCanvas.getContext('2d');

	drawImages();

	requestCam();
});

function drawImages() {
	diffContext.globalCompositeOperation = 'difference';

	img1 = new Image();
	img1.onload = function() {
		diffContext.drawImage(img1, 0, 0, 40, 20);

		img2 = new Image();
		img2.onload = function() {
			diffContext.drawImage(img2, 0, 0, 40, 20);
			makeGrayscale();
		};
		img2.src = 'images/transistor2.jpg';

	};
	img1.src = 'images/transistor1.jpg';
}

function makeGrayscale() {
	var imgData = diffContext.getImageData(0, 0, diffCanvas.width, diffCanvas.height);
	var data = imgData.data;

	var lit = 0;
	var overallAvg = 0;
	for (var i = 0; i < data.length; i += 4) {
		var avg = data[i] * 0.3 + data[i + 1] * 0.6 + data[i + 2] * 0.1;
		data[i] = 0;
		data[i + 1] = avg;
		data[i + 2] = 0;

		if (avg >= 128) {
			lit++;
		}

		overallAvg += avg;
	}

	overallAvg /= (data.length / 4);
	console.log(lit, overallAvg);

	diffContext.putImageData(imgData, 0, 0);
}

function requestCam() {
	var video = $('video')[0];

	var promise = navigator.mediaDevices.getUserMedia({
		audio: false,
		video: true
	});

	promise
		.then(function(stream) {
			console.log('hooray!');
			//video.srcObject = stream;
			video.srcObject = stream;
		})
		.catch(function(error) {
			console.log(error);
		});
}


/*
	old syntax...
	test

	var promise = navigator.webkitGetUserMedia({
		audio: false,
		video: true
	},
	function(stream) {
		video.src = window.URL.createObjectURL(stream);
         video.onloadedmetadata = function(e) {
           video.play();
         };
	},
	function(error){
		console.log(error);
	});
*/
