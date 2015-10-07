'use strict';

var path = require('path');

module.exports = function(gulp, plugins, args, config, taskTarget) {
  var dirs = config.directories;

  // Watch task
  gulp.task('watch', function() {
    if (!args.production) {
      // Copy
      gulp.watch([
        path.join(dirs.source, '**/*')
      ], ['copy']);
    }
  });
};
