#!/usr/bin/env node

require('shelljs/global');
var ngAnnotate = require("ng-annotate");
var uglifyJS = require("uglify-js");
var env = process.env.NODE_ENV ? 'prod' : 'dev';


function buildPath(subdir, filename){
  subdir = subdir || 'angular-mat-design';
  var path = ['public', subdir, 'dist'];
  if (filename) { path.push(filename); }
  return path.join('/');
}

var source = {
  'angular-mat-design': {
    js: {
      src: [
        "public/angular-mat-design/js/app.js",
      ],
      vendor: {
        dev: [
          "node_modules/angular/angular.js",
          "node_modules/angular-ui-router/release/angular-ui-router.js",
          "node_modules/angular-animate/angular-animate.js",
          "node_modules/angular-aria/angular-aria.js",
          "node_modules/angular-material/angular-material.js",
          "node_modules/angular-sanitize/angular-sanitize.js",
        ],
        prod: [
          "node_modules/angular/angular.min.js",
          "node_modules/angular-ui-router/release/angular-ui-router.min.js",
          "node_modules/angular-animate/angular-animate.min.js",
          "node_modules/angular-aria/angular-aria.min.js",
          "node_modules/angular-material/angular-material.min.js",
          "node_modules/angular-sanitize/angular-sanitize.min.js",
        ]
      }
    },
    css: {
      src: [
        "public/angular-mat-design/styles/style.css",
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
  },
  'angular': {
    js: {
      src: [
        "public/angular/js/app.js",
      ],
      vendor: {
        dev: [
          "node_modules/angular/angular.js",
          "node_modules/angular-ui-router/release/angular-ui-router.js",
          "node_modules/angular-animate/angular-animate.js",
          "node_modules/angular-aria/angular-aria.js",
          "node_modules/angular-material/angular-material.js",
          "node_modules/angular-sanitize/angular-sanitize.js",
        ],
        prod: [
          "node_modules/angular/angular.min.js",
          "node_modules/angular-ui-router/release/angular-ui-router.min.js",
          "node_modules/angular-animate/angular-animate.min.js",
          "node_modules/angular-aria/angular-aria.min.js",
          "node_modules/angular-material/angular-material.min.js",
          "node_modules/angular-sanitize/angular-sanitize.min.js",
        ]
      }
    },
    css: {
      src: [
        "public/angular/styles/style.css",
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
  }
};
// make path directory
console.time('build.js');
for (var key in source) {
  mkdir('-p', buildPath(key));

  // concat source js > public/dist/main.js
  var src = cat(source[key].js.src);

    // ngAnnotate
    src = ngAnnotate(src, {add: true, single_quotes: true}).src;

    // minify
    if (env === 'prod') {
      // console.log('* minifying...');
      src = uglifyJS.minify(src, {fromString: true}).code;
    }

  src.to(buildPath(key, 'main.js'));

  // concat source js > public/dist/vendor.js
  cat(source[key].js.vendor[env]).to(buildPath(key, 'vendor.js'));

  // concat source css > public/dist/main.css
  cat(source[key].css.src).to(buildPath(key, 'main.css'));

  // concat source css > public/dist/vendor.css
  cat(source[key].css.vendor[env]).to(buildPath(key, 'vendor.css'));

}
console.timeEnd('build.js');