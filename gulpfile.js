const gulp = require('gulp')
const path = require('path')
const runSequence = require('run-sequence')

const plugins = require('gulp-load-plugins')({ lazy: true })

const srcPath = 'src/'
const testPath = 'test/'
const tmpPath = 'tmp/'
const binPath = tmpPath + 'bin/'
const objPath = tmpPath + 'obj/'
const objBinPath = objPath + 'bin/'
const outPath = tmpPath + 'out/'
const outBinPath = outPath + 'bin/'

const srcFiles = srcPath + '**/*.js'

const destPath = process.env.NODE_ENV === 'development' ? objBinPath : binPath

// clean
gulp.task('clean', function () {
  const del = require('del')

  return del([ tmpPath ])
})

// compile
gulp.task('compile', function () {
  const pipeline = require('readable-stream').pipeline
  return pipeline(
    gulp.src(srcFiles),
    plugins.rename('leaflet-binglayer.min.js'),
    plugins.sourcemaps.init(),
    plugins.uglify({
      ie8: true
    }),
    plugins.sourcemaps.write('.'),
    gulp.dest(destPath),
    plugins.connect.reload()
  )
})

// analysis
gulp.task('analysis', [ 'analysis-eslint', 'analysis-cloc' ])
gulp.task('analysis-eslint', function () {
  return gulp.src(srcFiles)
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format())
    .pipe(plugins.eslint.failAfterError())
})
gulp.task('analysis-cloc', function (done) {
  const spawn = require('child_process').spawn
  const clocExe = process.platform === 'win32' ? '"' + path.join(__dirname, '.tmp/cloc.exe') + '"' : 'perl'
  const clocArgs = [
    '--3',
    '--quiet',
    '--progress-rate=0',
    '--xml',
    '--out tmp/cloc-results.xml',
    '--exclude-dir=.tmp,.vscode,build,node_modules,tmp',
    '.'
  ]
  if (process.platform !== 'win32') {
    clocArgs.unshift('"' + path.join(__dirname, '.tmp/cloc.pl') + '"')
  }
  const cloc = spawn(clocExe, clocArgs, {
    stdio: 'inherit',
    shell: true
  })
  cloc.on('exit', function (exitCode) {
    done(exitCode !== 0 && process.env.NODE_ENV !== 'development' ? 'ERROR: CLOC process exited with code ' + exitCode : null)
  })
})

// debug
gulp.task('debug-env', function () {
  const browserEnvVars = require('browser-env-vars')
  browserEnvVars.generate({
    outFile: objBinPath + 'env.js',
    whitelist: [ 'BING_KEY' ],
    esm: true
  })
})
gulp.task('debug-watch', function () {
  gulp.watch(srcFiles, [ 'compile' ])
    .add('**/.eslintrc.yml')
})
gulp.task('debug', [ 'compile', 'debug-env', 'debug-watch' ], function (done) {
  plugins.connect.server({
    name: 'Leaflet BingLayer',
    root: [testPath, objBinPath],
    port: 8000,
    livereload: true
  })
})

// package
gulp.task('package', [ 'compile' ], function () {
  return gulp.src(destPath + '**/*.*')
    .pipe(gulp.dest(outBinPath))
})

// build
gulp.task('build', function (done) {
  runSequence('analysis', 'compile', done)
})
// rebuild
gulp.task('rebuild', function (done) {
  runSequence('clean', 'build', done)
})
// release
gulp.task('release', function (done) {
  runSequence('rebuild', 'package', done)
})
gulp.task('default', [ 'debug' ])
