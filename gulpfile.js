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

// Tasks
gulp.task('jsxFiles', function() {
    gulp.src('js/freeBeer/src/*.js')
        .pipe(react())
        .pipe(sourcemaps.init())
             .pipe(concat('fbr.js'))
             .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build'));
});


var ourOthersList = [
              'js/freeBeer/translate.js',
              'js/core/PuffData.js',
              'js/core/Puffball.js',
              'js/core/PuffNet.js',
              'js/modules/PuffForum.js',
              'js/modules/PuffWardrobe.js',
              'js/freeBeer/usernameImport.js',
              'js/freeBeer/events.js',
              'js/freeBeer/gridbox.js',
              'js/freeBeer/immutable.js',
              'js/freeBeer/main.js']; // don't think we need this
gulp.task('ourOthers', function() {
    gulp.src(['js/core/*.js', 'js/modules/*.js', 'js/freeBeer/*.js'])
        .pipe(sourcemaps.init())
            .pipe(concat('pfb.js'))
            .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build'));

});


gulp.task('theirOthers', function() {
    gulp.src(['scripts/[!rJ]*.js','scripts/react/build/react-with-addons.js'])
        .pipe(sourcemaps.init())
            .pipe(concat('oth.js'))
            .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build'));

});


gulp.task('copyBinaries', function() {
    gulp.src('styles/fonts/*',{base: '.'})
        .pipe(gulp.dest('build'));

    gulp.src('img/*',{base: '.'})
        .pipe(gulp.dest('build'));

    gulp.src('img/chess/*',{base: '.'})
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


gulp.task('doDocs', function() {
    gulp.src('js/core/*.js')
        .pipe(jsdoc('doc'));
});


gulp.task('default', ['jsxFiles','css','ourOthers','theirOthers','copyBinaries']);

