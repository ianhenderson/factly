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
  for (var i = 0; i < 10; i++) {
    facts.push("fact" + i);
  }
  //===================================================================

  return {

    getAllFacts: function(){
      return facts;
    },

    addFact: function(fact){
      facts.push(fact);
    },

    getNextFact: function(){
      var fact = facts[currentInd];
      incrementIndex();
      return fact;
    },

    deleteFact: function(i){
      facts.splice(i,1);
      if (i <= currentInd){
        currentInd--;
      }
    }

  };
});