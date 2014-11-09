
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
    'vendor/bitcoinjs-min.js',
    'vendor/peer.js',
    'vendor/promise.min.js',
    'vendor/xbbcode.js',
    'libs/boron.js',
    'libs/filestuff.js',
    'libs/events.js',
    'libs/gridbox.js',
    'libs/dagoba.js',

    'core/PB.js',
    'core/PB.Net.js',
    'core/PB.Data.js',
    'core/PB.Users.js',
    'core/PB.Crypto.js',
    'core/PB.Persist.js',

    'modules/PB.M.Forum.js',
    'modules/PB.M.Wardrobe.js'
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