// Generated by CoffeeScript 1.3.3
var root, _Config;

_Config = (function() {

  function _Config() {
    this.websocketServerURL = 'http://192.168.100.20:9000/ws';
    return this;
  }

  return _Config;

})();

root = typeof exports !== "undefined" && exports !== null ? exports : this;

root.Config = (function() {
  var _instance;

  _instance = void 0;

  function Config() {
    if (_instance == null) {
      _instance = new _Config;
    }
    return _instance;
  }

  return Config;

})();
