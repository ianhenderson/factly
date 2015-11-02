var Page = require('page');

Page.base('/es6/#');
Page('/', log);
Page('/login', log);
Page('/home', log);
Page('/add', log);
Page('*', goHome);

function goHome(ctx, next){
  Page.redirect('/');
}

function log(){
  console.log('SWEET', location.href);
}