var bodyParser = require('body-parser');
var express = require('express');
var expressHandlebars  = require('express-handlebars');
var expressSession = require('express-session');
var passport = require('passport');
var passportTwitter = require('passport-twitter');

module.exports = function(app) {
	app.engine('.hbs', expressHandlebars({ extname: '.hbs' }));
	app.set('view engine', '.hbs');
	app.set('views', './dist/server/views');

	var twitterOptions = {
		consumerKey: process.env.TWITTER_CONSUMER_KEY,
		consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
		callbackURL: '/twitter/return'
	};
	passport.use(new passportTwitter.Strategy(twitterOptions, function(tokenKey, tokenSecret, profile, done) {
		var json = profile._json;
		var user = {
			name: json.name,
			handle: json.screen_name,
			image: json.profile_image_url_https,
			tokenKey: tokenKey,
			tokenSecret: tokenSecret
		};
		return done(null, user);
	}));

	passport.serializeUser(function(user, done) {
		done(null, user);
	});

	passport.deserializeUser(function(obj, done) {
		done(null, obj);
	});

	app.use(expressSession({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(bodyParser.json({ limit: '2mb' }));
	app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));

	app.use('/', require('./routes/home'));
	app.use('/upload', require('./routes/upload'));
	app.use('/twitter', require('./routes/twitter'));
	app.use(express.static('./dist/client'));
};
