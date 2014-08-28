angular.module('app.facts', [])
.factory('data', function($rootScope){

  var facts = [];
  var currentInd = 0;
  var incrementIndex = function(){
    currentInd++;
    if (currentInd >= facts.length){
      currentInd = 0;
    }
  };

  //=================Dummy Data for testing only=======================
  for (var i = 0; i < 20; i++) {
    var obj = {
      q: "fact" + i,
      a: "answer" + i
    };
    facts.push(obj);
  }
  //===================================================================

  return {

    getAllFacts: function(){
      return facts;
    },

    addFact: function(question, answer){
      var fact = {
        q: question,
        a: answer
      }
      facts.push(fact);
    },

    getNextFact: function(){
      var fact = facts[currentInd];
      incrementIndex();
      return fact;
    }

  };
});