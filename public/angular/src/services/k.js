module.exports = function($http, $q, LocalStorage) {

  function addWord(word, splitOnNewline) {
    word = word.replace(/\n+/g, '\n');
    if (splitOnNewline) {
      word = word.split(/\n/);
    }
    var config = {
      method: 'POST',
      url: '/api/facts',
      data: {
        fact: word
      }
    };
    return $http(config)
      .then(function(response) {
        return response.data;
      })
      .catch(function(response) {
        return response.data;
      });
  }

  function getNextChar() {
    var config = {
      method: 'GET',
      url: '/api/kanji'
    };
    return $http(config)
      .then(function(response) {
        var highlight = highlightKanji(response.data.kanji);
        response.data.words = response.data.words.map(highlight);
        return response.data;
      })
      .catch(function(response) {
        return response.data;
      });
  }

  function wrapKanji(kanji) {
    return [
      '<span class="hl">',
      kanji,
      '</span>'
    ].join('');
  }

  function highlightKanji(kanji, str) {
    return function(str) {
      return str.replace(kanji, wrapKanji(kanji));
    };
  }

  // Public methods to be used elsewhere in the app.
  return K = {
    addWord: addWord,
    getNextChar: getNextChar
  };
};