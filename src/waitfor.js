'use strict';

var log = require('./log.js');

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
module.exports = function (testFx, onReady, onTimeout, timeOutMillis) {
  var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 13000, //< Default Max Timout
      start = new Date().getTime(),
      condition = false,
      interval;
  interval = setInterval(function() {
    if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
      // If not time-out yet and condition not yet fulfilled
      condition = (typeof (testFx) === 'string' ? eval(testFx) : testFx()); //< defensive code
    }
    else {
      if (!condition) {
        // If condition still not fulfilled (timeout but condition is 'false')
        log('\'waitFor()\' timeout');
        if (typeof (onTimeout) === 'string') {
          eval(onTimeout);
        }
        else {
          onTimeout(condition);
        }
        clearInterval(interval);
      }
      else {
        // Condition fulfilled (timeout and/or condition is 'true')
        //log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
        clearInterval(interval); //< Stop this interval
        return typeof (onReady) === 'string' ? eval(onReady) : onReady(condition); //< Do what it's supposed to do once the condition is fulfilled
      }
    }
  }, 100);
};
