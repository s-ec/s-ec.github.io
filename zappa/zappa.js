;var __slice = Array.prototype.slice;var __hasProp = Object.prototype.hasOwnProperty;var __bind = function(fn, me){  return function(){ return fn.apply(me, arguments); };};var __extends = function(child, parent) {  for (var key in parent) {    if (__hasProp.call(parent, key)) child[key] = parent[key];  }  function ctor() { this.constructor = child; }  ctor.prototype = parent.prototype;  child.prototype = new ctor;  child.__super__ = parent.prototype;  return child;};var __indexOf = Array.prototype.indexOf || function(item) {  for (var i = 0, l = this.length; i < l; i++) {    if (this[i] === item) return i;  } return -1; };(function () {
    var settings, zappa;
    zappa = window.zappa = {};
    zappa.version = '0.4.22';
    settings = {"x-powered-by":true,"env":"development","subdomain offset":2,"views":"/home/ale/neatsheet/views","jsonp callback name":"callback","json spaces":2,"view engine":"ejs","zappa_prefix":"/zappa"};
    return zappa.run = function(func) {
      var app, apply_helpers, context, helpers, route;
      context = {};
      helpers = {};
      apply_helpers = function(ctx) {
        var helper, name, _fn;
        _fn = function(name, helper) {
          if (typeof helper === 'function') {
            return ctx[name] = function() {
              return helper.apply(ctx, arguments);
            };
          } else {
            return ctx[name] = helper;
          }
        };
        for (name in helpers) {
          helper = helpers[name];
          _fn(name, helper);
        }
        return ctx;
      };
      if (typeof Sammy !== "undefined" && Sammy !== null) {
        app = context.app = Sammy();
      }
      context.get = function() {
        var k, v, _ref, _results;
        if (typeof arguments[0] !== 'object') {
          return route({
            path: arguments[0],
            handler: arguments[1]
          });
        } else {
          _ref = arguments[0];
          _results = [];
          for (k in _ref) {
            v = _ref[k];
            _results.push(route({
              path: k,
              handler: v
            }));
          }
          return _results;
        }
      };
      context.helper = function(obj) {
        var k, v, _results;
        _results = [];
        for (k in obj) {
          v = obj[k];
          _results.push(helpers[k] = v);
        }
        return _results;
      };
      context.on = function(obj) {
        var action, message, _results;
        _results = [];
        for (message in obj) {
          action = obj[message];
          _results.push(context.socket.on(message, function(data) {
            var ctx;
            ctx = {
              app: app,
              socket: context.socket,
              id: context.socket.id,
              data: data,
              emit: context.emit,
              share: context.share
            };
            apply_helpers(ctx);
            return action.apply(ctx);
          }));
        }
        return _results;
      };
      context.connect = function() {
        return context.socket = io.connect.apply(io, arguments);
      };
      context.emit = function() {
        var k, v, _ref, _results;
        if (typeof arguments[0] !== 'object') {
          return context.socket.emit.apply(context.socket, arguments);
        } else {
          _ref = arguments[0];
          _results = [];
          for (k in _ref) {
            v = _ref[k];
            _results.push(context.socket.emit.apply(context.socket, [k, v]));
          }
          return _results;
        }
      };
      context.share = function(channel, socket, cb) {
        var zappa_prefix;
        zappa_prefix = settings.zappa_prefix;
        return $.getJSON(zappa_prefix + ("/socket/" + channel + "/" + socket.io.engine.id), cb);
      };
      route = function(r) {
        var ctx;
        ctx = {
          app: app
        };
        apply_helpers(ctx);
        return app.get(r.path, function(sammy_context) {
          ctx.params = sammy_context.params;
          ctx.sammy_context = sammy_context;
          ctx.render = function() {
            return sammy_context.render.apply(sammy_context, arguments);
          };
          ctx.redirect = function() {
            return sammy_context.redirect.apply(sammy_context, arguments);
          };
          return r.handler.apply(ctx);
        });
      };
      func.apply(context, [context]);
      if (context.socket != null) {
        context.socket.on('connect', function() {
          return context.share('__local', context.socket, function(data) {
            return context.key = data.key;
          });
        });
      }
      if (app != null) {
        return $(function() {
          return app.run('#/');
        });
      }
    };
  })();
