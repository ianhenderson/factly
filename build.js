#!/usr/bin/env node

require('shelljs/global');
var ngAnnotate = require("ng-annotate");
var uglifyJS = require("uglify-js");
var env = process.env.NODE_ENV ? 'prod' : 'dev';


function buildPath(filename){
  var path = ['public', 'dist'];
  if (filename) { path.push(filename); }
  return path.join('/');
}

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
// make path directory
console.time('build.js');
// console.log('* Making path...');
mkdir('-p', buildPath());

// concat source js > public/dist/main.js
// console.log('* Concat src > main.js...');
var src = cat(source.js.src);

  // ngAnnotate
  // console.log('* ngAnnotate-ing...');
  src = ngAnnotate(src, {add: true, single_quotes: true}).src;

  // minify
  if (env === 'prod') {
    // console.log('* minifying...');
    src = uglifyJS.minify(src, {fromString: true}).code;
  }

src.to(buildPath('main.js'));

// concat source js > public/dist/vendor.js
// console.log('* Concat src > vendor.js...');
cat(source.js.vendor[env]).to(buildPath('vendor.js'));

// concat source css > public/dist/main.css
// console.log('* Concat src > main.css...');
cat(source.css.src).to(buildPath('main.css'));

// concat source css > public/dist/vendor.css
// console.log('* Concat src > vendor.css...');
cat(source.css.vendor[env]).to(buildPath('vendor.css'));

// console.log('* Finished building!');
console.timeEnd('build.js');