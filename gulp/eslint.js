/*eslint no-process-exit:0 */

'use strict';

var path = require('path');
var gulpif = require('gulp-if');

module.exports = function(gulp, plugins, args, config, taskTarget) {
  var dirs = config.directories;

  // ESLint
  gulp.task('eslint', function() {
    gulp.src([
      path.join('gulpfile.js'),
      path.join(dirs.source, '**/*.js'),
      // Ignore all vendor folder files
      '!' + path.join('**/vendor/**', '*')
    ])
    .pipe(plugins.eslint({
      useEslintrc: true
    }))
    .pipe(plugins.eslint.format());
  });
};
