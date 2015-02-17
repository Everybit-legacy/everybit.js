/*
 *
 * This file is used along with gulp
 * It turns many files into one and makes them smaller by removing comments
 *
 */


// include gulp
var gulp = require('gulp');

// include plug-ins
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
// var rename = require('gulp-rename');
// var jsdoc = require('gulp-jsdoc');
var filesize = require('gulp-filesize');
// var zip = require('gulp-zip');


var coreBuildList = [
    'vendor/*',
    'libs/*',
    'core/EB.js',
    'core/EB.*.js',
    'modules/*',
    'types/*'
];

gulp.task('coreBuild', function () {
    gulp.src(coreBuildList)
        //.pipe(sourcemaps.init())
        .pipe(concat('everybit-min.js'))
        .pipe(filesize())
        .pipe(uglify())
        .pipe(filesize())
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest('build/everybitJS'));

});

gulp.task('debugBuild', function() {
    gulp.src(coreBuildList)
        .pipe(sourcemaps.init())
        .pipe(concat('everybit.js'))
        .pipe(filesize())
        .pipe(filesize())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build/everybitJS'));
})

gulp.task('default',['coreBuild']);
gulp.task('debug',['debugBuild']);
