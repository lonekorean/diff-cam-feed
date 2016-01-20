var bodyParser = require('body-parser');
var express = require('express');
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;

module.exports = function(app) {
	passport.use(new Strategy({
	    consumerKey: process.env.TWITTER_CONSUMER_KEY,
	    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
	    callbackURL: 'http://127.0.0.1:3000/login/twitter/return'
	}, function(token, tokenSecret, profile, cb) {
		console.log(token, tokenSecret);
		return cb(null, profile);
	}));

	passport.serializeUser(function(user, cb) {
		cb(null, user);
	});

	passport.deserializeUser(function(obj, cb) {
		cb(null, obj);
	});

	app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
	app.use(passport.initialize());
	app.use(passport.session());

	app.use(bodyParser.json({ limit: '2mb' }));
	app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));

	app.use(express.static('./dist/client'));

	app.use('/upload', require('./routes/upload'));

	app.get('/login/twitter', passport.authenticate('twitter'));

	app.get('/login/twitter/return', passport.authenticate('twitter', { failureRedirect: '/login' }),
		function(req, res) {
			res.redirect('/');
	  	});

};
