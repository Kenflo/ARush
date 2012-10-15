root = exports ? this # http://stackoverflow.com/questions/4214731/coffeescript-global-variables

$(document).ready ->
  root.SockJSClient()
  new HashtagSearch()
  $('#spinner').show()

  # update post elapsed time (a few seconds ago) every 20 seconds
  setInterval (->
    $('em[data-created-at]').each (index, element) =>
      element = $(element)
      element.html moment(element.attr 'data-created-at').fromNow()
  ), 20000
