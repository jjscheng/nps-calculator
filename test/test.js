var assert = require('assert');
var nps = require('../nps-stats');

describe('NPS', function() {
  describe('#score()', function() {

    // robustness to unexpected arguments
    it('should return 0 when no arguments are passed', function() {
      assert.equal(true, isNaN(nps.score()));
    });
    it('should return 0 with empty array argument', function() {
      assert.equal(-1, nps.score([1]));
    });
    it('should return 0 with an object missing a property "nps"', function() {
      assert.equal(true, isNaN(nps.score({key: "value"})));
    });

    // NPS accuracy tests with raw scores
    it('should return 1 with an array of all promoter values', function() {
      assert.equal(+1, nps.score([9,10,9,10,10,10]));
    });
    it('should return 0 with an array of all neutral values', function() {
      assert.equal(0, nps.score([7,7,7,8,8,8]));
    });
    it('should return 0 with sum(promoters) == sum(detractors)', function() {
      assert.equal(0, nps.score([1,2,3,4,5,9,10,9,10,9]));
    });
    it('should return -1 with an array of all detractor values', function() {
      assert.equal(-1, nps.score([1,2,3,4,5,6,5,4,3,2,1]));
    });
    it('should return -0.3 for the given dataset', function() {
      assert.equal(-0.3,
        nps.score([
          1,2,3,4,5,6,1,2,3,4,  // detractors x 10
          7,8,7,8,7,8,          // neutrals   x 6
          9,10,9,10             // promoters  x 4
        ]));
    });
    it('should return +0.4 for the given dataset', function() {
      assert.equal(0.4,
        nps.score([
          1,2,                  // detractors x 2
          7,8,7,8,7,8,7,8,      // neutrals   x 8
          9,9,9,9,9,9,9,9,9,9   // promoters  x 10
        ]));
    });
    it('should return 0.4 for the given dataset', function() {
      assert.equal(0.6,
        nps.score([
          1,2,                  // detractors x 2
                                // neutrals   x 0
          9,10,9,10,9,10,9,10   // promoters  x 8
        ]));
    });

    // NPS accuracy tests with distribution objects
    it('should return 1 with a distribution of all promoters', function() {
      assert.equal(+1, nps.score(
        { detractors: 0,
          neutrals:   0,
          promoters:  650 }
      ));
    });
    it('should return 0 with a distribution of all neutrals', function() {
      assert.equal(0, nps.score(
        { detractors: 0,
          neutrals:   246,
          promoters:  0   }
      ));
    });
    it('should return 0 with sum(promoters) == sum(detractors)', function() {
      assert.equal(0, nps.score(
        { detractors: 650,
          neutrals:   0,
          promoters:  650 }
      ));
    });
    it('should return -1 with a distribution of all detractors', function() {
      assert.equal(-1, nps.score(
        { detractors: 123,
          neutrals:   0,
          promoters:  0 }
      ));
    });
    it('should return -0.3 for the given dataset', function() {
      assert.equal(-0.3, nps.score(
          { detractors: 10,
            neutrals:   6,
            promoters:  4 }
        ));
    });
    it('should return +0.4 for the given dataset', function() {
      assert.equal(0.4, nps.score(
          { detractors: 2,
            neutrals:   8,
            promoters:  10 }
        ));
    });
    it('should return 0.4 for the given dataset', function() {
      assert.equal(0.6, nps.score(
        { detractors: 2,
          neutrals:   0,
          promoters:  8 }
      ));
    });
  });
});