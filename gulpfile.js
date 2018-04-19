const browserEnvVars = require('browser-env-vars');
const budo = require('budo');
const del = require('del');
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const runSequence = require('run-sequence');
const webpack = require('webpack-stream');

const srcPath = 'src/';
const testPath = 'test/';
const tmpPath = 'tmp/';
const objPath = tmpPath + 'obj/';
const outPath = tmpPath + 'out/';
const outBinPath = outPath + 'bin/';

const srcFiles = srcPath + '**/*.js';

gulp.task('clean', function() {
    return del([ tmpPath ]);
});

gulp.task('compile', function() {
    return gulp.src([ '*.js', srcFiles ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('debug', [ 'compile' ], function(done) {
    gulp.watch(srcFiles, [ 'compile' ])
        .add('**/.eslintrc.yml');

    // Create the destination directory for browser-env-vars
    const objTestPath = objPath + testPath;
    gulp.src('*.*', {
        read: false
    }).pipe(gulp.dest(objTestPath))
        .on('end', function() {
            browserEnvVars.generate({
                outFile: objTestPath + 'env.js',
                whitelist: [ 'BING_KEY' ],
                esm: true
            });
            budo('src/index.js', {
                dir: [
                    testPath,
                    objTestPath
                ],
                live: true,
                stream: process.stdout,
                port: 8000,
                watchGlob: [
                    srcFiles,
                    'test/index.html'
                ]
            }).on('exit', done);
        });
});

gulp.task('package', [ 'compile' ], function() {
    return gulp.src([ srcFiles ])
        .pipe(webpack({
            externals: 'leaflet',
            output: {
                filename: 'leaflet-binglayer.min.js'
            },
            plugins: [
                new webpack.webpack.optimize.UglifyJsPlugin({
                    uglifyOptions: {
                        compress: {
                            keep_fnames: true
                        },
                        mangle: {
                            keep_fnames: true
                        },
                        output: {
                            beautify: false
                        },
                        warnings: true
                    }
                })
            ]
        }))
        .pipe(gulp.dest(outBinPath));
});

gulp.task('rebuild', function(done) {
    runSequence('clean', 'compile', done);
});
gulp.task('release', function(done) {
    runSequence('clean', 'package', done);
});
gulp.task('default', [ 'compile' ]);
