const budo = require('budo');
const browserEnvVars = require('browser-env-vars');
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const webpack = require('webpack-stream');

const tmpPath = 'tmp/';
const objPath = tmpPath + 'obj/';
const outPath = tmpPath + 'out/';
const outBinPath = outPath + 'bin/';
const srcFiles = 'src/**/*.js';

gulp.task('clean', function() {
});

gulp.task('compile', function() {
    return gulp.src([ '*.js', srcFiles ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('debug', [ 'compile' ], function(cb) {
    gulp.watch(srcFiles, [ 'compile' ])
        .add('**/.eslintrc.yml');

    // Create the destination directory for browser-env-vars
    const objTestPath = objPath + 'test/';
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
                    'test',
                    objTestPath
                ],
                live: true,
                stream: process.stdout,
                port: 8000,
                watchGlob: [
                    srcFiles,
                    'test/index.html'
                ]
            }).on('exit', cb);
        });
});

gulp.task('test', [ 'compile' ], function() {
});

gulp.task('analysis', [ 'compile' ], function() {
});

gulp.task('package', [ 'compile', 'test' ], function() {
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

gulp.task('default', [ 'compile' ]);
