# Change settings here
class _Config
  constructor: ->
    @websocketServerURL = 'http://localhost:9000/ws'
    return @

root = exports ? this # http://stackoverflow.com/questions/4214731/coffeescript-global-variables

# The publicly accessible Singleton fetcher
class root.Config
  _instance = undefined
  # Must be declared here to force the closure on the class
  constructor: -> # Must be a static method
    _instance ?= new _Config
    return _instance

