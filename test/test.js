var assert = require('assert');
var nps = require('../nps-stats');

describe('NPS', function() {
  describe('#score()', function() {

    // robustness to unexpected arguments
    it('should return 0 when no arguments are passed', function() {
      nps.score(0, nps.score());
    });
    it('should return 0 with empty array argument', function() {
      nps.score(0, nps.score([]));
    });
    it('should return 0 with an object missing a property "nps"', function() {
      nps.score(0, nps.score({key: "value"}));
    });

    // score accuracy tests
    it('should return 1 with an array of all promoter values', function() {
      nps.score(+1, [9,10,9,10,10,10]);
    });
    it('should return 0 with an array of all neutral values', function() {
      nps.score(0, [7,7,7,8,8,8]);
    });
    it('should return -1 with an array of all detractor values', function() {
      nps.score(0, [1,2,3,4,5,6,5,4,3,2,1]);
    });

  });
});