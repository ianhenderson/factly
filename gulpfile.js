var gulp = require('gulp');
var gulpIf = require('gulp-if');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var env = process.env.NODE_ENV ? 'prod' : 'dev';


//////////////////
// Source Files //
//////////////////

var source = {
  js: {
    src: [
      "public/js/app.js",
    ],
    vendor: {
      dev: [
        "node_modules/angular/angular.js",
        "node_modules/angular-ui-router/release/angular-ui-router.js",
        "node_modules/angular-animate/angular-animate.js",
        "node_modules/angular-aria/angular-aria.js",
        "node_modules/angular-material/angular-material.js",
      ],
      prod: [
        "node_modules/angular/angular.min.js",
        "node_modules/angular-ui-router/release/angular-ui-router.min.js",
        "node_modules/angular-animate/angular-animate.min.js",
        "node_modules/angular-aria/angular-aria.min.js",
        "node_modules/angular-material/angular-material.min.js",
      ]
    }
  },
  css: {
    src: [
      "public/styles/style.css",
      ],
    vendor: {
      dev: [
        "node_modules/angular-material/angular-material.css",
      ],
      prod: [
        "node_modules/angular-material/angular-material.min.css",
      ]
    }
  }
};

gulp.task('default', function() {

  console.log('Compiling files...');

  gulp.src(source.js.vendor[env])
      .pipe(concat('vendor.js'))
      .pipe(gulp.dest('public/dist/'));

  gulp.src(source.js.src)
      .pipe(concat('main.js'))
      .pipe(annotateIfProd())
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

function annotateIfProd(stream){
  return gulpIf(env === 'prod', ngAnnotate());
}