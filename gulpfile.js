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

// Toggele build main or ICX
var buildFor = 'icx'


// JSX FILES
if(buildFor == 'icx') {
    // Tasks
    var jsxList = [
        "js/freeBeer/src/icxtableView.js",
        "js/freeBeer/src/icxdisplay.js"
    ];
} else {
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
}


if(buildFor == 'icx') {
    gulp.task('jsxFiles', function() {
        gulp.src(jsxList)
            .pipe(react())
            //.pipe(sourcemaps.init())
                 .pipe(concat('fbr.js'))
                 .pipe(uglify())
            //.pipe(sourcemaps.write())
            .pipe(gulp.dest('build/icx'));
    });
} else {
    gulp.task('jsxFiles', function() {
        gulp.src(jsxList)
            .pipe(react())
            //.pipe(sourcemaps.init())
            .pipe(concat('fbr.js'))
            .pipe(uglify())
            //.pipe(sourcemaps.write())
            .pipe(gulp.dest('build'));
    });

}


// OTHER PUFFBALL / ICX FILES
if(buildFor == 'icx') {
    var ourOthersList = [
        'js/helpers.js',
        'js/icx/translate.js',
        'js/icx/translate-zh.js',
        'js/icx/words.js',


        'js/libs/boron.js',
        'js/libs/filestuff.js',
        'js/libs/events.js',
        'js/libs/gridbox.js',
        'js/libs/dagoba.js',

        // 'js/core/PB.js',
        'js/core/PB.Net.js',
        'js/core/PB.Data.js',
        // 'js/core/PB.Crypto.js',
        'js/core/PB.Persist.js',

        'js/modules/PB.M.Forum.js',
        'js/modules/PB.M.Wardrobe.js',

        'js/icx/arrays.js',
        'js/icx/main.js'
    ];
} else {
    var ourOthersList = [
        'js/helpers.js',
        'js/freeBeer/translate.js',
        'js/freeBeer/translate-zh.js',

        'js/libs/boron.js',
        'js/libs/events.js',
        'js/libs/gridbox.js',
        'js/libs/dagoba.js',

        'js/core/PB.js',
        'js/core/PB.Net.js',
        'js/core/PB.Data.js',
        'js/core/PB.Crypto.js',
        'js/core/PB.Persist.js',

        'js/modules/PB.M.Forum.js',
        'js/modules/PB.M.Wardrobe.js',

        'js/freeBeer/usernameImport.js',

        'js/freeBeer/main.js'
    ];
}


if(buildFor == 'icx') {
    gulp.task('ourOthers', function () {
        gulp.src(ourOthersList)
            //.pipe(sourcemaps.init())
            .pipe(concat('pfb.js'))
            .pipe(filesize())
            .pipe(uglify())
            .pipe(filesize())
            //.pipe(sourcemaps.write())
            .pipe(gulp.dest('build/icx'));

    });
} else {
    gulp.task('ourOthers', function () {
        gulp.src(ourOthersList)
            //.pipe(sourcemaps.init())
            .pipe(concat('pfb.js'))
            .pipe(filesize())
            .pipe(uglify())
            .pipe(filesize())
            //.pipe(sourcemaps.write())
            .pipe(gulp.dest('build'));

    });


}


// THEIR OTHERS

if(buildFor == 'icx') {
    var theirOthersList = [
        // 'js/vendor/bitcoinjs-min.js',
        'js/vendor/markdown.js',
        'js/vendor/polyglot.min.js',
        'js/vendor/promise.min.js',
        'js/vendor/timeSince.js',
        'js/vendor/xbbcode.js',
        'js/vendor/react/build/react-with-addons.js'
    ];
} else {
    var theirOthersList = [

    ];
}

if(buildFor == 'icx') {
    gulp.task('theirOthers', function () {
        gulp.src(theirOthersList)
            //.pipe(sourcemaps.init())
            .pipe(concat('oth.js'))
            .pipe(filesize())
            .pipe(uglify())
            .pipe(filesize())
            //.pipe(sourcemaps.write())
            .pipe(gulp.dest('build/icx'));
    });
} else {
    gulp.task('theirOthers', function () {
        gulp.src(['js/vendor/[!rJ]*.js', 'js/vendor/react/build/react-with-addons.js'])
            //.pipe(sourcemaps.init())
            .pipe(concat('oth.js'))
            .pipe(filesize())
            .pipe(uglify())
            .pipe(filesize())
            //.pipe(sourcemaps.write())
            .pipe(gulp.dest('build'));

    });

}

// FILES TO COPY DIRECTLY
if(buildFor == 'icx') {
    gulp.task('copyFiles', function() {
        gulp.src('styles/fonts/*',{base: '.'})
            .pipe(gulp.dest('build/icx'));

        gulp.src('img/*',{base: '.'})
            .pipe(gulp.dest('build/icx'));

        gulp.src('site-icx/icxconfig.js',{base: '.'})
            .pipe(gulp.dest('build/icx'));

        gulp.src('js/cryptoworker.js',{base: '.'})
            .pipe(gulp.dest('build/icx'));

        gulp.src('js/core/PB.js',{base: '.'})
            .pipe(gulp.dest('build/icx'));

        gulp.src('js/core/PB.Crypto.js',{base: '.'})
            .pipe(gulp.dest('build/icx'));

        gulp.src('js/vendor/bitcoinjs-min.js',{base: '.'})
            .pipe(gulp.dest('build/icx'));

    });

} else {
    gulp.task('copyFiles', function() {
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

        gulp.src('site-everybit/config.js',{base: '.'})
            .pipe(gulp.dest('build'));
    });

}


// CSS MINIFICATION
if(buildFor == 'icx') {
    gulp.task('css', function () {
        gulp.src('styles/*.css')
            .pipe(concat('style.css'))
            .pipe(minifyCSS())
            .pipe(gulp.dest('build/icx/styles'));
    });
} else {
    gulp.task('css', function () {
        gulp.src('styles/*.css')
            .pipe(concat('style.css'))
            .pipe(minifyCSS())
            .pipe(gulp.dest('build/styles'));
    });
}


// ZIP AS NEEDED
if(buildFor != 'icx') {
    gulp.task('zip', function() {
        gulp.src(['build/*.js','build/*.html','build/img/*','build/styles/*','build/styles/fonts/*'],{base: '.'})
            .pipe(zip('puffball.zip'))
            .pipe(gulp.dest('build'));
    });

    gulp.task('doDocs', function() {
        gulp.src('js/core/*.js')
            .pipe(jsdoc('doc'));
    });

}



if(buildFor == 'icx') {
    gulp.task('default', ['jsxFiles', 'css', 'ourOthers', 'theirOthers', 'copyFiles']);
} else {

    gulp.task('default', ['jsxFiles', 'css', 'ourOthers', 'theirOthers', 'copyFiles', 'zip']);
}