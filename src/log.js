'use strict';

module.exports = function(data) {
  var currentDate = '[' + new Date().toUTCString() + '] ';
  console.log(currentDate, data);
};
