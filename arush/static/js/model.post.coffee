class Post
  @postTemplateSelector

  constructor: (json) ->
    self = @
    self.postTemplateSelector = '#post-tpl'
    self = $.extend(self, JSON.parse(json))

  render_tpl: ->
    tpl = $(@postTemplateSelector).clone().removeClass('tpl').attr('id', '')

    user = $('.user:first', tpl)
    user.attr('href', user.attr('href') + @user.username)
    user.html @user.name

    $('.avatar:first', tpl).attr('src', @user.avatar_image.url)

    post_text = $(@html)
    $('a', post_text).attr('target', '_blank')
    $('.text:first', tpl).html post_text

    time_elapsed = $('.time-elapsed:first', tpl)
    time_elapsed.html moment(@created_at).fromNow()
    time_elapsed.attr('data-created-at', @created_at)

    return tpl





