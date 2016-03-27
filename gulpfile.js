var gulp = require('gulp'),
	sass = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	jshint = require('gulp-jshint'),
	jshintStylish = require('jshint-stylish');

// file paths
var sources = {
	'client': {
		'static': ['./client/**/*.{html,gif,jpg,png}'],
		'css': ['./client/css/**/*.scss'],
		'js': ['./client/js/**/*.js']
	},
	'server': {
		'js': ['./server/**/*.js'],
		'hbs': ['./server/**/*.hbs']
	},
	'config': {
		'js': ['env.js', 'gulpfile.js', 'package.json']
	}
};

// prefer jshint config here rather than hidden file
var jshintConfig = {
	'lookup': false,
	'globals': {
		'define': false
	}
};

// front-end static stuff
gulp.task('client-static', function() {
	gulp.src(sources.client.static)
		.pipe(gulp.dest('./dist/client'));
});

// front-end css stuff
gulp.task('client-css', function() {
	gulp.src(sources.client.css)
		.pipe(sass({ errLogToConsole: true }))
		.pipe(autoprefixer())
		.pipe(gulp.dest('./dist/client/css'));
});

// front-end javascript
gulp.task('client-js', function() {
	gulp.src(sources.client.js)
		.pipe(jshint(jshintConfig))
		.pipe(jshint.reporter(jshintStylish))
		.pipe(gulp.dest('./dist/client/js'));
});

// back-end javascript
gulp.task('server-js', function() {
	gulp.src(sources.server.js)
		.pipe(jshint(jshintConfig))
		.pipe(jshint.reporter(jshintStylish))
		.pipe(gulp.dest('./dist/server'));
});

// back-end handlebars templates
gulp.task('server-hbs', function() {
	gulp.src(sources.server.hbs)
		.pipe(gulp.dest('./dist/server'));
});

// configuration javascript
gulp.task('config-js', function() {
	gulp.src(sources.config.js)
		.pipe(jshint(jshintConfig))
		.pipe(jshint.reporter(jshintStylish));
});

// build site
gulp.task('default', ['client-static', 'client-css', 'client-js', 'server-js', 'server-hbs', 'config-js']);

// build site and watch for changes
gulp.task('watch', ['default'], function() {
	gulp.watch(sources.client.static, ['client-static']);
	gulp.watch(sources.client.css, ['client-css']);
	gulp.watch(sources.client.js, ['client-js']);
	gulp.watch(sources.server.js, ['server-js']);
	gulp.watch(sources.server.hbs, ['server-hbs']);
	gulp.watch(sources.config.js, ['config-js']);
});
