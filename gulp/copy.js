'use strict';

var path = require('path');

module.exports = function(gulp, plugins, args, config, taskTarget) {
  var dirs = config.directories;
  var dest = path.join(taskTarget);

  // Copy
  gulp.task('copy', function() {
    return gulp.src([
        path.join(dirs.source, '**/*'),
        '!' + path.join(dirs.source, '{**/\_*,**/\_*/**}'),
        '!' + path.join(dirs.source, '**/*.jade')
      ])
      .pipe(plugins.changed(dest))
      .pipe(gulp.dest(dest));
  });
};
