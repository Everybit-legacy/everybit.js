
// include gulp
var gulp = require('gulp');

// include plug-ins
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var jsdoc = require('gulp-jsdoc');
var filesize = require('gulp-filesize');
var zip = require('gulp-zip');


var coreBuildList = [
    'js/vendor/bitcoinjs-min.js',
    'js/vendor/peer.js',
    'js/vendor/promise.min.js',
    'js/vendor/xbbcode.js',
    'js/libs/boron.js',
    'js/libs/filestuff.js',
    'js/libs/events.js',
    'js/libs/gridbox.js',
    'js/libs/dagoba.js',

    'js/core/PB.js',
    'js/core/PB.Net.js',
    'js/core/PB.Data.js',
    'js/core/PB.Users.js',
    'js/core/PB.Crypto.js',
    'js/core/PB.Persist.js',

    'js/modules/PB.M.Forum.js',
    'js/modules/PB.M.Wardrobe.js'
];

gulp.task('coreBuild', function () {
    gulp.src(coreBuildList)
        //.pipe(sourcemaps.init())
        .pipe(concat('everybit-min.js'))
        .pipe(filesize())
        //.pipe(uglify())
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