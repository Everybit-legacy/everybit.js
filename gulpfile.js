// include gulp
var gulp = require('gulp');

// include plug-ins
var react = require('gulp-react');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var minifyCSS = require('gulp-minify-css');
var rename = require('gulp-rename');
var jsdoc = require('gulp-jsdoc');
var filesize = require('gulp-filesize');
var zip = require('gulp-zip');

// Tasks
var jsxList = [
    "js/freeBeer/src/tableView.js",
    "js/freeBeer/src/display.js",
    "js/freeBeer/src/slider.js",
    "js/freeBeer/src/menu.js",
    "js/freeBeer/src/headerBar.js",
    "js/freeBeer/src/puffbox.js",
    "js/freeBeer/src/publishEmbed.js",
    "js/freeBeer/src/tools.js"
];
gulp.task('jsxFiles', function() {
    gulp.src(jsxList)
        .pipe(react())
        //.pipe(sourcemaps.init())
             .pipe(concat('fbr.js'))
             .pipe(uglify())
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest('build'));
});


var ourOthersList = [
              'js/helpers.js',
              'js/freeBeer/translate.js',
              'js/freeBeer/translate-zh.js',

              'js/libs/boron.js',
              'js/libs/events.js',
              'js/libs/gridbox.js',
              'js/libs/dagoba.js',

              'js/core/PB.js',
              'js/core/PB.Data.js',
              'js/core/PB.Net.js',

              'js/modules/PuffForum.js',
              'js/modules/PuffWardrobe.js',
              'js/freeBeer/usernameImport.js',

              'js/freeBeer/main.js']; 
gulp.task('ourOthers', function() {
    gulp.src(ourOthersList)
        //.pipe(sourcemaps.init())
            .pipe(concat('pfb.js'))
            .pipe(filesize())
            .pipe(uglify())
            .pipe(filesize())
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest('build'));

});


gulp.task('theirOthers', function() {
    gulp.src(['scripts/[!rJ]*.js','scripts/react/build/react-with-addons.js'])
        // .pipe(sourcemaps.init())
            .pipe(concat('oth.js'))
            .pipe(filesize())
            .pipe(uglify())
            .pipe(filesize())
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest('build'));

});


gulp.task('copyBinaries', function() {
    gulp.src('styles/fonts/*',{base: '.'})
        .pipe(gulp.dest('build'));

    gulp.src('img/*',{base: '.'})
        .pipe(gulp.dest('build'));

    gulp.src('img/chess/*',{base: '.'})
        .pipe(gulp.dest('build'));

    gulp.src('img/slides/*',{base: '.'})
        .pipe(gulp.dest('build'));

    gulp.src('img/jscolor/*',{base: '.'})
        .pipe(gulp.dest('build'));

    gulp.src('config.js',{base: '.'})
        .pipe(gulp.dest('build'));


});



gulp.task('css', function() {
    gulp.src('styles/*.css')
    .pipe(concat('style.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('build/styles'));
});


gulp.task('zip', function() {
    gulp.src(['build/*.js','build/*.html','build/img/*','build/styles/*','build/styles/fonts/*'],{base: '.'})
        .pipe(zip('puffball.zip'))
        .pipe(gulp.dest('build'));
});


gulp.task('doDocs', function() {
    gulp.src('js/core/*.js')
        .pipe(jsdoc('doc'));
});


gulp.task('default', ['jsxFiles','css','ourOthers','theirOthers','copyBinaries','zip']);
