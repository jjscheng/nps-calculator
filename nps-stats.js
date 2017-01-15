;(function (root, factory) {

  'use strict';

  // UMD definition (umdjs returnExports)
  // Uses Node, AMD or browser globals to create a module.
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.returnExports = factory();
  }

}(this, function () {

  // Module exported methods
  // -----------------------

  var NPS = {};

  // Calculate the Net Promoter Score (NPS) for a tally
  NPS.score = function(obj) {
    var t = (obj instanceof Array) ? NPS.tally(obj) : obj;
    return t.score || ((t.promoters - t.detractors) / t.total);
  };

  // Calculate the NPS variance for a tally
  NPS.variance = function(t) {
    var score = t.score || NPS.score(t);
    return ((Math.pow(+1 - score, 2) * t.promoters)
          + (Math.pow(-1 - score, 2) * t.detractors)
          + (Math.pow(+0 - score, 2) * t.neutrals)) / t.total;
  };

  // Calculate the standard deviation for the population
  NPS.stddev = function(t) {
    return Math.sqrt(NPS.variance(t));
  }

  // Calculate the standard error for the sample
  NPS.stderr = function(t) {
    t.stddev = t.stddev || NPS.stddev(t);
    return t.stddev / Math.sqrt(t.total);
  }

  // Return a tally of raw scores along with the group NPS score.
  NPS.tally = function(scores) {
    var p = 0, d = 0, n = 0;
    for (var i = 0; i < scores.length; i++) {
      var s = scores[i];
      if (typeof s != 'number' || s < 0 || s > 10) continue; // skip invalid values
      if (s >= 9) { p++; continue; };
      if (s <= 6) { d++; continue; };
      if (s == 7 || s == 8) { n++ };
    };
    var tally = {
        promoters:  p,
        detractors: d,
        neutrals:   n,
        total:      p + d + n,
    };
    tally.score = NPS.score(tally);
    return tally;
  }

  // Return the variance, standard deviation and standard error for tallied scores
  NPS.stats = function(t) {
    var variance  = t.variance  || NPS.variance(t);
    var stddev    = t.stddev    || NPS.stddev(t);
    var stderr    = t.stdderr   || NPS.stderr(t);
    return {
      variance: t.variance  || NPS.variance(t),
      stddev:   stddev,
      stderr:   stderr
    };
  }

  // Module return
  return NPS;

}));
