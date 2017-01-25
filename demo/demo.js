var nps   = require('../src/nps-stats'),
    _     = require('underscore'),
    Papa  = require('papaparse'),
    $     = require('jquery'),
    Highcharts = require('highcharts/highstock');

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

        var stats = nps.stats(results.data, { neutrals: 'passives' });

        // SEGMENT INDIVIDUALS INTO OUTLIER SERIES
        rows = _.map(results.data, function(d) {

          var dist = nps.dist(d, { neutrals: 'passives' });
          var stderr  = stats.stddev / Math.sqrt(dist.total);
          var lcl     = Math.max(stats.nps - (1.96 * stderr), -1);
          var ucl     = Math.min(stats.nps + (1.96 * stderr), +1);
          var series  = (dist.nps > ucl) ? "Outperform" : ((dist.nps < lcl) ? "Underperform" : "Average");

          return {
            label:  d.slicer,
            total:  dist.total,
            nps:    dist.nps ,
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
        var xserr   = _.map(xs, function(x) {return stats.stddev / Math.sqrt(x)});

        // calculate the lower and upper confidence limits
        var lcl     = _.map(xserr, function(xerr) { return Math.max(stats.nps - (1.96 * xerr),-1);});
        var ucl     = _.map(xserr, function(xerr) { return Math.min(stats.nps + (1.96 * xerr), 1);});
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