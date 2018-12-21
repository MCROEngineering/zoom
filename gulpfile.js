const browserify = require('browserify');
const gulp = require('gulp');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify-es').default;
const gutil = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const babelify = require('babelify');
const es2015presets = require('babel-preset-es2015');

gulp.task('build', function () {
    // set up the browserify instance on a task basis
    
    const c = browserify({
        entries: './dist/lib/index.js',
        debug: true,
        transform: [babelify.configure({
            extensions: ['.ts', '.js'], 
            presets: [ es2015presets ]
        })]
    });
   

    return c.bundle()
        .pipe(source('../bundle/zoom.min.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        // Add transformation tasks to the pipeline here
        // .pipe(uglify())
        .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/bundle'));
});