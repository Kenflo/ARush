// Generated by CoffeeScript 1.3.3
var root, _SockJSClient;

_SockJSClient = (function() {

  function _SockJSClient() {
    var self;
    self = this;
    self = $.extend(new SockJS(root.Config().websocketServerURL), this);
    self.out_queue = [];
    self.in_queue = [];
    self.send_parent = self.send;
    self.send = function(command, payload) {
      return self.out_queue.push(function() {
        var request_data;
        request_data = {
          command: command,
          payload: payload
        };
        self.send_parent(JSON.stringify(request_data));
        $('footer').hide();
        $('#posts').empty();
        return $('#spinner').show();
      });
    };
    self.onopen = function(evt) {
      return self.flush_out_queue();
    };
    self.onmessage = function(evt) {
      var inTask, _results;
      self.in_queue.push(function() {
        var post;
        post = new Post(evt.data);
        $('#spinner').hide();
        return $('#posts').prepend(post.render_tpl().fadeIn(1000, function() {
          return $('footer').show();
        }));
      });
      _results = [];
      while ((inTask = self.in_queue.shift()) !== undefined) {
        _results.push(inTask());
      }
      return _results;
    };
    return self;
  }

  _SockJSClient.prototype.flush_out_queue = function() {
    var outTask, _results;
    _results = [];
    while ((outTask = this.out_queue.shift()) !== undefined) {
      if (this.readyState !== SockJS.OPEN) {
        break;
      }
      _results.push(outTask());
    }
    return _results;
  };

  return _SockJSClient;

})();

root = typeof exports !== "undefined" && exports !== null ? exports : this;

root.SockJSClient = (function() {
  var _instance;

  _instance = void 0;

  function SockJSClient() {
    if (_instance == null) {
      _instance = new _SockJSClient;
    }
    return _instance;
  }

  return SockJSClient;

})();
