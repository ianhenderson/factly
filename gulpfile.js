var gulp = require('gulp');
var gulpIf = require('gulp-if');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var env = process.env.NODE_ENV ? 'prod' : 'dev';


//////////////////
// Source Files //
//////////////////

var source = {};
source.js = {};
source.js.vendor = {};
source.js.src = {};
source.css = {};
source.css.vendor = {};
source.css.src = {};

source.js.vendor.dev = [
  "public/lib/angular/angular.js",
  "public/lib/ui-router/release/angular-ui-router.js",
  "public/lib/angular-animate/angular-animate.js",
  "public/lib/angular-aria/angular-aria.js",
  "public/lib/angular-material/angular-material.js",
];

source.js.vendor.prod = [
  "public/lib/angular/angular.min.js",
  "public/lib/ui-router/release/angular-ui-router.min.js",
  "public/lib/angular-animate/angular-animate.min.js",
  "public/lib/angular-aria/angular-aria.min.js",
  "public/lib/angular-material/angular-material.min.js",
];

source.css.vendor.dev= [
  "public/lib/angular-material/angular-material.css",
];

source.css.vendor.prod= [
  "public/lib/angular-material/angular-material.min.css",
];

source.js.src= [
  "public/js/app.js",
];

source.css.src= [
  "public/styles/style.css",
];

gulp.task('default', function() {

  console.log('Compiling files...');

  gulp.src(source.js.vendor[env])
      .pipe(concat('vendor.js'))
      .pipe(gulp.dest('public/dist/'));

  gulp.src(source.js.src)
      .pipe(concat('main.js'))
      .pipe(ngAnnotate())
      .pipe(minifyIfProd())
      .pipe(gulp.dest('public/dist/'));

  gulp.src(source.css.vendor[env])
      .pipe(concat('vendor.css'))
      .pipe(gulp.dest('public/dist/'));

  gulp.src(source.css.src)
      .pipe(concat('main.css'))
      .pipe(gulp.dest('public/dist/'));

  console.log('Finished compiling files.');

});

function minifyIfProd(stream){
  return gulpIf(env === 'prod', uglify());
}