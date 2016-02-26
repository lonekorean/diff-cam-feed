$(function() {
	var scoreThreshold = 8;			// min for an image to be considered significant
	var considerTime = 4000;		// time window to consider best capture, in ms
	var chillTime = 16000;			// time to chill after committing, in ms
	var historyMax = 3;				// max number of past captures to show on page

	var stopConsideringTimeout;
	var stopChillingTimeout;
	var status;						// disabled, watching, considering, chilling
	var bestDiff;					// most significant diff while considering

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
		DiffCamEngine.init({
			video: $video[0],
			motionCanvas: $motionCanvas[0],
			captureWidth: 512,
			captureHeight: 384,
			startCallback: startStreaming,
			errorCallback: disableControls,
			captureCallback: checkImage
		});

		setStatus('disabled');
		setTweakInputs();

		$toggle.on('click', toggleStreaming);
		$tweaks.on('submit', getTweakInputs);
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
			DiffCamEngine.requestCam();
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
		DiffCamEngine.stopStreaming();
		clearTimeout(stopConsideringTimeout);
		clearTimeout(stopChillingTimeout);
		setStatus('disabled');
		bestDiff = undefined;

		$motionScore.text('');
		$toggle
			.removeClass('stop')
			.addClass('start');
	}

	function disableControls(error) {
		$toggle
			.removeClass('start stop')
			.prop('disabled', true);
	}

	function checkImage(diff) {
		$motionScore.text(diff.score);

		if (status === 'watching' && diff.score > scoreThreshold) {
			// this diff is good enough to start a consideration time window
			setStatus('considering');
			bestDiff = diff;
			stopConsideringTimeout = setTimeout(stopConsidering, considerTime);
		} else if (status === 'considering' && diff.score > bestDiff.score) {
			// this is the new best diff for this consideration time window
			bestDiff = diff;
		}
	}

	function stopConsidering() {
		commit(bestDiff);
		bestDiff = undefined;

		startChilling();
	}

	function startChilling() {
		setStatus('chilling');
		stopChillingTimeout = setTimeout(stopChilling, chillTime);
	}

	function stopChilling() {
		setStatus('watching');
	}

	function commit(diff) {
		// prep values
		var src = diff.newImageSrc;
		var time = new Date().toLocaleTimeString().toLowerCase();
		var score = diff.score;

		// load html from template
		var html = $historyItemTemplate.html();
		var $newHistoryItem = $(html);

		// set values and add to page
		$newHistoryItem.find('img').attr('src', src);
		$newHistoryItem.find('.time').text(time);
		$newHistoryItem.find('.score').text(score);
		$history.prepend($newHistoryItem);

		// trim
		$('.history figure').slice(historyMax).remove();

		// TODO: remove short circuit
		console.log('upload here');
		return;
		$.ajax({
			type: 'POST',
			url: '/upload',
			data: {
				score: diff.score,
				dataURL: diff.newImageSrc.replace('data:image/png;base64,', '')
			}
		});

	}

	// kick things off
	init();
});
