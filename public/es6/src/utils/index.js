var qs = document.querySelector.bind(document);
var qsa = document.querySelectorAll.bind(document);

function on(el, event, cb){
  el.addEventListener(event, cb);
}

module.exports = {
  qsa: qsa,
  qs: qs,
  on: on,
};