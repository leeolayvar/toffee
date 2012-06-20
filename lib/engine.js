// Generated by IcedCoffeeScript 1.3.3a
(function() {
  var coffee, engine, fs, parser, view, vm;

  parser = require('./dude_lang').parser;

  coffee = require('coffee-script');

  vm = require('vm');

  fs = require('fs');

  engine = (function() {

    function engine(options) {
      this.viewCache = {};
      this.lastCacheReset = Date.now();
      this.maxCacheAge = 1000;
    }

    engine.prototype.run = function(filename, options, cb) {
      var res, v;
      if (Date.now() - this.lastCacheReset > this.maxCacheAge) this._resetCache();
      if (this.viewCache[filename] != null) {
        v = this.viewCache[filename];
      } else {
        v = this._loadAndCache(filename);
      }
      if (v) {
        res = v.run(options);
        return cb(null, res);
      } else {
        return cb("Couldn't load " + filename, null);
      }
    };

    engine.prototype._loadAndCache = function(filename) {
      var txt, v;
      txt = fs.readFileSync(filename, 'utf-8');
      if (txt) {
        v = new view(txt);
        this.viewCache[filename] = v;
        return v;
      } else {
        console.log("Couldn't load " + filename + ".");
        return null;
      }
    };

    engine.prototype._resetCache = function() {
      this.viewCache = {};
      return this.lastCacheReset = Date.now();
    };

    return engine;

  })();

  view = (function() {

    function view(txt) {
      this.codeObj = null;
      this.coffeeScript = null;
      this.javaScript = null;
      this.scriptObj = null;
      this.loadFromText(txt);
    }

    view.prototype.loadFromText = function(txt) {
      this.txt = txt;
      return this.codeObj = parser.parse(txt);
    };

    view.prototype.run = function(vars) {
      var res, script;
      script = this._toScriptObj();
      vars.__res__ = "";
      script.runInNewContext(vars);
      res = vars.__res__;
      delete vars.__res__;
      return res;
    };

    view.prototype._toScriptObj = function() {
      var d, txt;
      if (!(this.scriptObj != null)) {
        txt = this._toJavascript();
        d = Date.now();
        this.scriptObj = vm.createScript(txt);
        console.log("Compiled to ScriptObj in " + (Date.now() - d) + "ms");
      }
      return this.scriptObj;
    };

    view.prototype._toJavascript = function() {
      var c, d;
      if (!(this.javaScript != null)) {
        c = this._toCoffee();
        d = Date.now();
        this.javaScript = coffee.compile(c);
        console.log("Compiled to JavaScript in " + (Date.now() - d) + "ms");
      }
      return this.javaScript;
    };

    view.prototype._toCoffee = function() {
      var chunk, d, indent_depth, res, _i, _len, _ref;
      if (!(this.coffeeScript != null)) {
        d = Date.now();
        indent_depth = 1;
        res = this._coffeeHeaders();
        _ref = this.codeObj;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          chunk = _ref[_i];
          switch (chunk[0]) {
            case 'DUDE':
              res += ("\n" + (this._space(indent_depth)) + "__res__ += ") + '"""' + chunk[1] + '"""';
              break;
            case 'COFFEE':
              res += "\n" + (this._reindent(chunk[1], indent_depth));
              break;
            case 'INDENT':
              indent_depth += 1;
              break;
            case 'OUTDENT':
              indent_depth -= 1;
              break;
            default:
              throw 'Bad parsing.';
          }
        }
        res += this._coffeeFooters();
        this.coffeeScript = res;
        console.log("Compiled to CoffeeScript in " + (Date.now() - d) + "ms");
      }
      return this.coffeeScript;
    };

    view.prototype._reindent = function(coffee, indent_depth) {
      var line, lines, res, rxx, strip;
      lines = coffee.split('\n');
      while (lines.length && lines[0].match(/^[\t\r ]*$/)) {
        lines = lines.slice(1);
      }
      if (!lines.length) return '';
      rxx = /^[\t ]*/;
      strip = lines[0].match(rxx)[0].length;
      res = ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = lines.length; _i < _len; _i++) {
          line = lines[_i];
          _results.push("" + (this._space(indent_depth)) + line.slice(strip));
        }
        return _results;
      }).call(this)).join("\n");
      return res;
    };

    view.prototype._space = function(n) {
      var i;
      return ((function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
          _results.push("  ");
        }
        return _results;
      })()).join("");
    };

    view.prototype._coffeeHeaders = function() {
      var header;
      header = "run = ->";
      return header;
    };

    view.prototype._coffeeFooters = function() {
      var footer;
      footer = "\n" + (this._space(1)) + "return __res__\nrun()";
      return footer;
    };

    return view;

  })();

  exports.view = view;

  exports.engine = engine;

}).call(this);