self.dc = self.dc || {};

(function() {
	self.dc.imageDiff = {
		diff: function(img1, img2, options) {
			options = options || {};
			options.width = options.width || 10;
			options.height = options.height || 10;
			options.threshold = options.threshold || 128;

			var canvas = document.createElement('canvas');
			canvas.width = options.width;
			canvas.height = options.height;

			var context = canvas.getContext('2d');
			context.globalCompositeOperation = 'difference';
			context.drawImage(img1, 0, 0, canvas.width, canvas.height);
			context.drawImage(img2, 0, 0, canvas.width, canvas.height);

			var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
			var data = imgData.data;

			var thresholdCount = 0;
			var diffAverage = 0;
			for (var i = 0; i < data.length; i += 4) {
				var diff = data[i] * 0.3 + data[i + 1] * 0.6 + data[i + 2] * 0.1;
				data[i] = 0;
				data[i + 1] = diff;
				data[i + 2] = 0;

				if (diff >= options.threshold) {
					thresholdCount++;
				}
				diffAverage += diff;
			}

			diffAverage /= data.length / 4;

			return {
				imgData: imgData,
				thresholdCount: thresholdCount,
				diffAverage: diffAverage
			};
		}
	};
})();
