'use strict';

var webServer = require('webserver'),
    system = require('system'),
    Q = require('q'),
    queue = require('./queue.js'),
    log = require('./log.js'),
    waitFor = require('./waitfor.js');

function sendError(response, e) {
  log(e.code + ': ' + e.message);
  response.statusCode = e.code;
  response.write(e.message);
  response.close();
}

function makeUrl(requestUrl) {
  var parts = decodeURIComponent(requestUrl).split('?');
  if (parts[0] === '/') {
    parts.shift();
  }
  var requestUri = parts[0];
  var queryArray = (parts.length === 2) ? parts[1].split('&') : [];
  var fragment = '';
  var queryString = '';
  var mode = 'html5';

  for (var i = 0; i < queryArray.length; i++) {
    var queryItemArray = queryArray[i].split('=');
    if (queryItemArray[0] === '_escaped_fragment_') {
      if (queryItemArray[1]) {
        fragment = queryItemArray[1];
      }
    }
    else if (queryItemArray[0] === 'mode') {
      mode = queryItemArray[1];
    }
    else {
      queryString += queryArray[i];
    }
  }
  //debugger;
  var res;
  switch (mode) {
    case 'html5':
      res = requestUri + '/' + fragment + (queryString ? '?' + queryString : '');
      break;
    case 'hashbang':
      res = requestUri + '/#!' + fragment + (queryString ? '?' + queryString : '');
      break;
    default:
      res = '';
  }
  return res;
}

var server = webServer.create();

if (system.args.length !== 2) {
  log('Usage: app.js <host[:port]>');
  phantom.exit(1);
}

var address = system.args[1];
log('Starting prerender on ' + address);

server.listen(address, function (request, response) {
  queue(function (pid) {
    var deferred = Q.defer();
    log('Got request: ' + request.url);
    if (request.url !== '/') {
      var url = makeUrl(request.url);
      if (!url) {
        sendError(response, { code: 400, message: 'Error building URL' });
        //page.close();
        deferred.resolve();
      }
      log('Got url: ' + url);
      var page = require('webpage').create();

      var pageError = false;

      page.onError = function (msg, trace) {
        pageError = true;
        sendError(response, { code: 500, message: msg });
        deferred.resolve();
      };

      page.onConsoleMessage = function (msg, lineNum, sourceId) {
        log('CONSOLE: ' + msg);
      };

      page.open(url, 'post', 'prerendering=true', function (status) {
        if (!pageError) {
          if (status === 'success') {
            waitFor(function() {
              //debugger;
              return page.evaluate(function () {
                //debugger;
                var wrapper = {},
                    htmlEl = document.documentElement;
                if (htmlEl.getAttribute('x-error') !== null) {
                  //console.log('x-error!=null');
                  wrapper.errcode = htmlEl.getAttribute('x-error');
                  wrapper.errmsg = htmlEl.getAttribute('x-error-msg');
                  return wrapper;
                }
                else if (htmlEl.getAttribute('x-status') === 'ready') {
                  //console.log('x-status=ready');
                  htmlEl.setAttribute('x-prerendered', '');
                  // Lets remove meta fragment
                  // ** See the index.tpl.php **
                  // var meta_fragment = document.querySelector('meta[name=fragment]');
                  // if (meta_fragment) {
                  //   meta_fragment.remove();
                  // }
                  wrapper.html = htmlEl.outerHTML;
                  return wrapper;
                }
                return false;
              });
            }, function(result) {
              if (result.errcode) {
                sendError(response, { code: result.errcode, message: result.errmsg });
                page.close();
              }
              else {
                response.statusCode = 200;
                response.headers = {
                  'Cache': 'no-cache',
                  'Content-Type': 'text/html;charset=utf-8'
                };
                response.write(result.html);
                response.close();
                page.close();
              }
              deferred.resolve();
            }, function(result) {
              sendError(response, { code: 503, message: 'Too long page execution' });
              page.close();
              deferred.resolve();
            });
          }
          else {
            sendError(response, { code: 404, message: url });
            page.close();
          }
        }
      });
    }
    else {
      sendError(response, { code: 400, message: 'Empty URL' });
      page.close();
      deferred.resolve();
    }
    return deferred.promise;
  }, 1);
});
