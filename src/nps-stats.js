;(function (root, factory) {

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

  'use strict';

  var NPS = {};

  // Return the NPS score along with a frequency distribution of scores.
  // The arr parameter can be an array of values, an array of objects with a
  // nps score property or an array of distributions.  Default property names
  // can be overwritten using a mapping in the props parameter.
  NPS.dist = function(arr, props) {

    var __props =
      { // if not provided, look in default params
        promoters:  "promoters",
        detractors: "detractors",
        neutrals:   "neutrals",
        nps:        "nps"
      };
    for(var key in props) __props[key] = props[key];

    // Wrap single object input as an array of one element
    if (!(arr instanceof Array)) { arr = [arr] }

    var p = 0, d = 0, n = 0;
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i];
      if (typeof s === 'object') {
        p += s[__props.promoters]  || 0;
        d += s[__props.detractors] || 0;
        n += s[__props.neutrals]   || 0;
        s  = s[__props.nps]        || s;
      }
      if (typeof s === 'number') {
        if (s == 9 || s == 10) p++;
        else if (s == 7 || s == 8) n++;
        else if (s <= 6 && s >= 0) d++;
      } // else skip records missing properties or having out-of-range values
    }

    return {
        promoters:  p,
        detractors: d,
        neutrals:   n,
        total:      (p + n + d),
        nps:        (p - d) / (p + n + d)
    };
  };

  // Convenience method to return the NPS score only
  NPS.score = function(arr, props) { return NPS.dist(arr, props).nps; };

  // Return the variance, standard deviation and standard error for an
  // NPS distribution
  NPS.stats = function(arr, props) {

    var dist = NPS.dist(arr, props);
    var nps  = dist.nps;
    var variance =
       ((Math.pow(+1 - nps, 2) * dist.promoters)
      + (Math.pow(-1 - nps, 2) * dist.detractors)
      + (Math.pow(+0 - nps, 2) * dist.neutrals)) / dist.total;
    var stddev = Math.sqrt(variance);
    var stderr = stddev / Math.sqrt(dist.total);

    return {
      promoters:  dist.promoters,
      detractors: dist.detractors,
      neutrals:   dist.neutrals,
      total:      dist.total,
      nps:        nps,
      variance:   variance,
      stddev:     stddev,
      stderr:     stderr
    };
  };

  // Module return
  return NPS;

}));
