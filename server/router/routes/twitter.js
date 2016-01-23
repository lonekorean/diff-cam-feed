var express = require('express');
var passport = require('passport');

var router = express.Router();

router.get('/login', passport.authenticate('twitter'));

router.get('/return', passport.authenticate('twitter', { failureRedirect: '/' }), function(req, res) {
	res.redirect('/');
});

module.exports = router;
