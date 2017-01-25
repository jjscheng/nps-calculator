var nps   = require('../src/nps-stats'),
    _     = require('underscore'),
    Papa  = require('papaparse'),
    $     = require('jquery'),
    Highcharts = require('highcharts/highstock');

// calculate NPS
function npsScore(d) {
  return (+d.promoters / +d.total) - (+d.detractors / +d.total);
}

// calculate NPS variance
function npsVariance(d) {

  var nps = npsScore(d);

  return  Math.pow(+1 - nps, 2) * (+d.promoters  / +d.total)
    +   Math.pow(+0 - nps, 2) * (+d.passives   / +d.total)
    +   Math.pow(-1 - nps, 2) * (+d.detractors / +d.total);
}

// format chart data
function seriesData(rows, series) {

  var data = _.filter(rows, function(r) {return r.series == series});

  return _.map(data, function(d) {
    return {
      name: d.label,
      x: d.total,
      y: d.nps
    }
  });
}

// create range using injected step function
function rangeStep(start, stop, stepFunc) {
  if (arguments.length <= 1) {
    stop = start || 0;
    start = 0;
  }
  stepFunc = arguments[2] || 1;

  var range = [];
  var x = start;

  while(x < stop) {
    range.push(x);
    x += stepFunc(x);
  }
  range.push(x);

  return range;
}

$("document").ready(function() {

  // Add handler to re-render chart results on file selection
  $('#csvFileSelect').change(function(evt) {

    // Parse the new file selected
    var file = evt.target.files[0];
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      error: function(err) {
        console.log(err);
      },
      complete: function(results) {

        // SCOPE VARIABLES FOR PROCESSING
        var sample = {
          promoters:  0,
          passives:   0,
          detractors: 0,
          total:      0,
          nps:        0,
          stddev:     0,
          variance:   0
        };

        // SUMMARISE PERFORMANCE FOR SAMPLE
        _.each(results.data, function(d) {

          // collect totals
          d.total = +d.total || +d.promoters + +d.passives + +d.detractors;

          // produce summary statistics for std err calculations
          sample.promoters    += +d.promoters;
          sample.passives     += +d.passives;
          sample.detractors   += +d.detractors;
          sample.total        += +d.total;

        });

        sample.nps = npsScore(sample);
        sample.variance = npsVariance(sample);
        sample.stddev = Math.sqrt(sample.variance);

        // SEGMENT INDIVIDUALS INTO OUTLIER SERIES
        rows = _.map(results.data, function(d) {

          var stderr  = sample.stddev / Math.sqrt(d.total);
          var nps     = npsScore(d);
          var lcl     = Math.max(sample.nps - (1.96 * stderr), -1);
          var ucl     = Math.min(sample.nps + (1.96 * stderr), +1);
          var series  = (nps > ucl) ? "Outperform" : ((nps < lcl) ? "Underperform" : "Average");

          return {
            label:  d.slicer,
            total:  d.total,
            nps:    nps ,
            stderr: stderr,
            lcl:    lcl,
            ucl:    ucl,
            series: series
          }

        });

        var outperformers   = seriesData(rows, "Outperform");
        var underperformers = seriesData(rows, "Underperform");
        var avgperformers   = seriesData(rows, "Average");

        // CREATE CONFIDENCE BANDS
        // create the x-values as a logarithmic scale
        var xs = rangeStep(
          1, // start from 1
          (_.max(rows, function(d){ return d.total;})).total, // stop at the max total in the data set
          function(x) {
            return Math.pow(10, Math.floor(Math.log10(x)));  // increase by jumps of 10^x
          }
        );

        // calculate the standard errors based on the x-values
        var xserr   = _.map(xs, function(x) {return sample.stddev / Math.sqrt(x)});

        // calculate the lower and upper confidence limits
        var lcl     = _.map(xserr, function(xerr) { return Math.max(sample.nps - (1.96 * xerr),-1);});
        var ucl     = _.map(xserr, function(xerr) { return Math.min(sample.nps + (1.96 * xerr), 1);});
        var lcldata = _.zip(xs, lcl);
        var ucldata = _.zip(xs, ucl);

        // RENDER CHART
        Highcharts.chart('container', {
          title: {
            text: 'Net Promoter Score (NPS) Performance'
          },
          xAxis: {
            title: {
              enabled: true,
              text: 'Total surveys'
            },
            type: 'logarithmic',
            min: 1,
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true,
            gridLineWidth: 1
          },
          yAxis: {
            title: {
              text: 'NPS Score'
            },
            min: -1,
            max: 1,
            gridLineWidth: 1
          },
          plotOptions: {
            scatter: {
              marker: {
                radius: 5,
                symbol: 'circle',
                states: {
                  hover: {
                    enabled: true,
                    lineColor: 'rgb(100,100,100)'
                  }
                }
              },
              states: {
                hover: {
                  marker: {
                    enabled: false
                  }
                }
              }
            },
            spline: {
              marker: {
                enabled: false
              }
            }
          },
          tooltip: {
            headerFormat: '<b>{point.key}</b><br>',
            pointFormat: 'Surveys: {point.x}, NPS: {point.y:.2f}'
          },
          series: [
            {
              type:   'scatter',
              name:   'Outperform',
              color:  'rgba(51, 204, 51, .5)',
              data:   outperformers
            },
            {
              type:   'scatter',
              name:   'Underperform',
              color:  'rgba(255, 0, 0, .5)',
              data:   underperformers
            },
            {
              type:   'scatter',
              name:   'Average',
              color:  'rgba(230, 230, 230, .5)',
              data:   avgperformers
            },
            {
              type:   'spline',
              name:   'LCL',
              color:  'rgba(150, 150, 150, .5)',
              dashStyle: 'dash',
              data:   lcldata
            },
            {
              type:   'spline',
              name:   'UCL',
              dashStyle: 'dash',
              color:  'rgba(150, 150, 150, .5)',
              data:   ucldata
            }
          ]
        });
      }
    });

  });
});