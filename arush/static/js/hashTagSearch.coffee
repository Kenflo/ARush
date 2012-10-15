class HashtagSearch
  constructor: ->
    self = @

    # url set hashtags handling
    url_hashtags = []
    for hashtag in decodeURIComponent(window.location.hash.replace('#','')).split('|')
      url_hashtags.push(hashtag) if hashtag

    root.SockJSClient().send('set_hashtag_filter', url_hashtags)

    # hastag filter
    tagManager = $('#tag-manager').tagsManager(
      delimeters: [32, 13], # enter and space
      CapitalizeFirstLetter: false,
      prefilled: url_hashtags,
      tagChangeCallback: (tagManager, tagList) ->
        self.send(tagList)

        # update url hash
        tagList = $.map(tagList, encodeURIComponent) # # remove # from tag if present
        location.hash = '#' + tagList.join('|') # whitespace
    )

  send: (tagList) ->
    root.SockJSClient().send('set_hashtag_filter', tagList)
    root.SockJSClient().flush_out_queue()




