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

  // Return a tally of raw scores along with the group NPS score.
  NPS.tally = function(arr, props) {

    // default values for properties
    props = props ||
      { promoters:  "promoters",
        detractors: "detractors",
        neutrals:   "neutrals",
        nps:        "nps"
      };

    var p = 0, d = 0, n = 0;
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i];
      if (typeof s === 'object') {
        p += s[props.promoters]  || 0;
        d += s[props.detractors] || 0;
        n += s[props.neutrals]   || 0;
        s  = s[props.nps]        || s;
      }
      if (typeof s === 'number' && s >= 0 || s <= 10) {
        if (s >= 9) { p++; continue; };
        if (s <= 6) { d++; continue; };
        if (s == 7 || s == 8) { n++; continue; };
      } else continue; // skip invalid records
    };
    return {
        promoters:  p,
        detractors: d,
        neutrals:   n,
        total:      p + d + n,
    };
  }

  // Calculate the Net Promoter Score (NPS) for a tally, an array of raw scores
  // or an array of tallies.
  NPS.score = function(t) {
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
    t.variance = t.variance || NPS.variance(t);
    return Math.sqrt(NPS.variance(t));
  }

  // Calculate the standard error for the sample
  NPS.stderr = function(t) {
    t.stddev = t.stddev || NPS.stddev(t);
    return t.stddev / Math.sqrt(t.total);
  }

  // Return the variance, standard deviation and standard error in a single object call
  NPS.stats = function(t) {
    return {
      variance: t.variance  || NPS.variance(t),
      stddev:   t.stddev    || NPS.stddev(t),
      stderr:   t.stdderr   || NPS.stderr(t)
    };
  }

  // Module return
  return NPS;

}));
