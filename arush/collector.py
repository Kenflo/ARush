#!/usr/bin/env python
# -*- coding: utf-8 -*-
import requests
import simplejson
import redis
import time
from settings import *


redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)
last_saved_post_id = int(redis_client.get(CFG_LAST_FETCHED_POST_ID_KEY) or 0)

while True:
    before_id = last_saved_post_id + CFG_API_FETCH_COUNT
    if last_saved_post_id == 0:
        before_id = 0

    url = 'https://alpha-api.app.net/stream/0/posts/stream/global?since_id=%d&before_id=%d&count=%d' % (last_saved_post_id, before_id, CFG_API_FETCH_COUNT)
    print url
    try:
        request = requests.get(
            url=url,
            headers={'Authorization': 'Bearer %s' % (CFG_APPNET_TOKEN)}
        )
    except Exception as e:
        print e # TODO: logging
        continue

    pipe = redis_client.pipeline()

    posts = simplejson.loads(request.content)['data']
    if not len(posts) or int(posts[0]['id']) == last_saved_post_id:
        print 'sleep'
        time.sleep(0.1)
    else:
        for post in posts:
            post_id = int(post['id'])
            post_key = 'post:%d' % (post_id)
            post_stringified = simplejson.dumps(post)
            print post_id

            # save post
            pipe.set(post_key, post_stringified)
            pipe.expire(post_key, CFG_EXPIRE_SECONDS)

            # save posts in a list
            pipe.lpush('posts', post_id)
            # TODO: remove old posts

            # save hashtags in a list
            hashtags = []
            for hashtag in post.get('entities', {}).get('hashtags', []):
                if not hashtag.get('name'): continue

                hashtag_normalized = hashtag['name'].lower()
                hash_key = 'posts:hashtag:%s' % (hashtag_normalized)
                pipe.lpush(hash_key, post_id)
                pipe.expire(hash_key, CFG_EXPIRE_SECONDS)
                hashtags.append(hashtag_normalized)

            # save max read post id
            if post_id > last_saved_post_id:
                pipe.set(CFG_LAST_FETCHED_POST_ID_KEY, post_id)
                last_saved_post_id = post_id

            # post to ws listeners
            # TODO: make async
            try:
                requests.post(
                    url=CFG_TORNDO_MGMT_SERVER_URL,
                    data={
                        'command': 'send_post_to_listeners',
                        'post': post_stringified,
                        'hashtags': simplejson.dumps(hashtags)
                    }
                )
            except requests.exceptions.ConnectionError as e:
                print e # TODO: logging

    pipe.execute()

