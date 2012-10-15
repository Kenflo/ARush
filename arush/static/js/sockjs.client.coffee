# Change settings here
class _SockJSClient
  constructor: ->
    self = @
    self = $.extend(new SockJS(root.Config().websocketServerURL), @)
    self.out_queue = []
    self.in_queue = []

    self.send_parent = self.send
    self.send = (command, payload) ->
      self.out_queue.push( ->
        request_data =
          command: command
          payload: payload

        self.send_parent(JSON.stringify(request_data))

        $('footer').hide()
        $('#posts').empty()
        $('#spinner').show()
      )

    self.onopen = (evt) ->
      self.flush_out_queue()

    self.onmessage = (evt) ->
      self.in_queue.push( ->
        post = new Post(evt.data)
        $('#spinner').hide()
        $('#posts').prepend(post.render_tpl().fadeIn(1000, ->
          $('footer').show()
        ))

      )
      while (inTask = self.in_queue.shift()) isnt `undefined`
        inTask()

    return self

  flush_out_queue: ->
    while (outTask = @out_queue.shift()) isnt `undefined`
      if @.readyState != SockJS.OPEN
        break
      outTask()

root = exports ? this # http://stackoverflow.com/questions/4214731/coffeescript-global-variables

# The publicly accessible Singleton fetcher
class root.SockJSClient
  _instance = undefined
  # Must be declared here to force the closure on the class
  constructor: -> # Must be a static method
    _instance ?= new _SockJSClient
    return _instance

