'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var generator = require('loopback-sdk-vue');
var path = require('path');
var WatchJS = require('watchjs');

var watch = WatchJS.watch;
var unwatch = WatchJS.unwatch;

//  This callback will be passed to watch, this refers to the datasource
function disconnectDataSource(prop, action, newValue) {
  if (newValue === true) {
    this.disconnect();
    unwatch(this, 'connected');
  }
}

module.exports = function (options) {
  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      cb();
      return;
    }

    var app;
    try {
      app = require(path.resolve(file.path));

      //  Incase options is undefined.
      options = options || {vueResourceName: 'lbServices', apiUrl: undefined};

      options.vueResourceName = options.vueResourceName || 'lbServices';
      options.apiUrl = options.apiUrl || app.get('restApiRoot') || '/api';

      gutil.log('Loaded LoopBack app', gutil.colors.magenta(file.path));
      gutil.log('Generating',
        gutil.colors.magenta(options.vueResourceName),
        'for the API endpoint',
        gutil.colors.magenta(options.apiUrl)
      );

      var script = generator.services(
        app,
        options.vueResourceName,
        options.apiUrl
      );

      file.contents = new Buffer(script);

      gutil.log('Generated vue-resource file.');

      this.push(file);

      var dataSources = app.dataSources;
      for (var dataSource in dataSources) {
        if (dataSources.hasOwnProperty(dataSource)) {
          var ds = dataSources[dataSource];
          watch(ds, 'connected', disconnectDataSource);
        }
      }
    } catch (err) {
      this.emit('error', new gutil.PluginError('gulp-loopback-sdk-vue', err));
    }

    cb();
    return;
  });
};
