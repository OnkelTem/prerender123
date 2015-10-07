'use strict';

var log = require('./log.js');

module.exports = (function() {
  var pidGenerator = 0,
      concurrentCounter = 0,
      queueList = [],
      pidList = [],
      interval = 0;

  return function (callback, max) {
    var pid = ++pidGenerator,
        start,
        end;
    if (concurrentCounter < max) {
      log('SP: ' + pid);
      concurrentCounter++;
      start = new Date().getTime();
      callback(pid).then(function() {
        concurrentCounter--;
        end = new Date().getTime();
        log('SP: ' + pid + ' finished in ' + (end - start) + ' ms');
      });
    }
    else {
      log('PP: ' + pid + ' queued');
      queueList.push(callback);
      pidList.push(pid);
      if (!interval) {
        interval = setInterval(function () {
          if (concurrentCounter < max) {
            concurrentCounter++;
            callback = queueList.shift();
            pid = pidList.shift();
            log('PP: ' + pid);
            start = new Date().getTime();
            callback(pid).then(function() {
              concurrentCounter--;
              end = new Date().getTime();
              log('PP: ' + pid + ' finished in ' + (end - start) + ' ms');
              if (queueList.length === 0) {
                clearInterval(interval);
                interval = 0;
              }
            });
          }
        }, 100);
      }
    }
  };
})();
