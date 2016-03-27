$(function() {
	var isTestMode = false;
	var scoreThreshold = 16;		// min for an image to be considered significant
	var considerTime = 4000;		// time window to consider best capture, in ms
	var chillTime = 12000;			// time to chill after committing, in ms
	var historyMax = 3;				// max number of past captures to show on page

	var stopConsideringTimeout;
	var stopChillingTimeout;
	var status;						// disabled, watching, considering, chilling
	var bestCapture;				// most significant capture while considering

	var $toggle = $('.toggle');
	var $tweaks = $('.tweaks');
	var $video = $('.video');
	var $motionCanvas = $('.motion');
	var $motionScore = $('.motion-score');
	var $status = $('.status');
	var $meter = $('.meter');
	var $history = $('.history');

	var $pixelDiffThreshold = $('#pixel-diff-threshold');
	var $scoreThreshold = $('#score-threshold');
	var $historyItemTemplate = $('#history-item-template');

	function init() {
		// don't want console logs from adapter.js
		adapter.disableLog(true);

		setStatus('disabled');
		DiffCamEngine.init({
			video: $video[0],
			motionCanvas: $motionCanvas[0],
			initSuccessCallback: initSuccess,
			startCompleteCallback: startStreaming,
			captureCallback: checkCapture
		});
	}

	function initSuccess() {
		setTweakInputs();
		$toggle
			.addClass('start')
			.prop('disabled', false)
			.on('click', toggleStreaming);
		$tweaks
			.on('submit', getTweakInputs)
			.find('input').prop('disabled', false);
	}

	function setStatus(newStatus) {
		$meter.removeClass(status);

		status = newStatus;
		switch (status) {
			case 'disabled':
			case 'watching':
				$meter.css('animation-duration', '');
				break;
			case 'considering':
				$meter.css('animation-duration', considerTime + 'ms');
				break;
			case 'chilling':
				$meter.css('animation-duration', chillTime + 'ms');
				break;
		}

		$status.text(status);
		$meter.addClass(status);
	}

	function setTweakInputs() {
		$pixelDiffThreshold.val(DiffCamEngine.getPixelDiffThreshold());
		$scoreThreshold.val(scoreThreshold);
	}

	function getTweakInputs(e) {
		e.preventDefault();
		DiffCamEngine.setPixelDiffThreshold(+$pixelDiffThreshold.val());
		scoreThreshold = +$scoreThreshold.val();
	}

	function toggleStreaming() {
		if (status === 'disabled') {
			// this will turn around and call startStreaming() on success
			DiffCamEngine.start();
		} else {
			stopStreaming();
		}
	}

	function startStreaming() {
		startChilling();
		$toggle
			.removeClass('start')
			.addClass('stop');
	}

	function stopStreaming() {
		DiffCamEngine.stop();
		clearTimeout(stopConsideringTimeout);
		clearTimeout(stopChillingTimeout);
		setStatus('disabled');
		bestCapture = undefined;

		$motionScore.text('');
		$toggle
			.removeClass('stop')
			.addClass('start');
	}

	function checkCapture(capture) {
		$motionScore.text(capture.score);

		if (status === 'watching' && capture.score > scoreThreshold) {
			// this diff is good enough to start a consideration time window
			setStatus('considering');
			bestCapture = capture;
			stopConsideringTimeout = setTimeout(stopConsidering, considerTime);
		} else if (status === 'considering' && capture.score > bestCapture.score) {
			// this is the new best diff for this consideration time window
			bestCapture = capture;
		}
	}

	function stopConsidering() {
		commit();
		startChilling();
	}

	function startChilling() {
		setStatus('chilling');
		stopChillingTimeout = setTimeout(stopChilling, chillTime);
	}

	function stopChilling() {
		setStatus('watching');
	}

	function commit() {
		// prep values
		var bestCaptureUrl = bestCapture.getURL();
		var src = bestCaptureUrl;
		var time = new Date().toLocaleTimeString().toLowerCase();
		var score = bestCapture.score;

		// load html from template
		var html = $historyItemTemplate.html();
		var $newHistoryItem = $(html);

		// set values and add to page
		$newHistoryItem.find('img').attr('src', src);
		$newHistoryItem.find('.time').text(time);
		$newHistoryItem.find('.score').text(score);
		$history.prepend($newHistoryItem);

		// trim
		$trim = $('.history figure').slice(historyMax);
		$trim.find('img').attr('src', '');
		$trim.remove();

		$.ajax({
			type: 'POST',
			url: '/upload',
			data: {
				isTestMode: isTestMode,
				score: bestCapture.score,
				dataURL: bestCaptureUrl.replace('data:image/png;base64,', '')
			}
		});

		bestCapture = undefined;
	}

	// kick things off
	init();
});
