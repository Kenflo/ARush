# -*- coding: utf-8 -*-
from sockjs.tornado import SockJSConnection
from tornado.escape import json_decode, json_encode
from tornado import web, gen
import tornadoredis
from settings import CFG_REDIS_SERVER, CFG_REDIS_PORT


redis_client = tornadoredis.Client(CFG_REDIS_SERVER, CFG_REDIS_PORT)
redis_client.connect()

WS_CHANNEL_LISTENERS = {} # {'adn': ['client_instance']}
WS_LISTENERS_CHANNELS = {} # {'<client_instance>': ['#adn']}
DEFAULT_CHANNEL_KEY = None
INITIAL_POSTS_COUNT = 25


class WebSocketHandler(SockJSConnection):
    def _add_client_to_channel(self, channel_name):
        WS_CHANNEL_LISTENERS.setdefault(channel_name, [])
        WS_CHANNEL_LISTENERS[channel_name].append(self)

        WS_LISTENERS_CHANNELS.setdefault(self, [])
        WS_LISTENERS_CHANNELS[self].append(channel_name)

    def _remove_client_from_channel(self, channel_name):
        try:
            del WS_CHANNEL_LISTENERS[channel_name][WS_CHANNEL_LISTENERS[channel_name].index(self)]
        except (KeyError, ValueError):
            pass
        try:
            del WS_LISTENERS_CHANNELS[self][WS_LISTENERS_CHANNELS[self].index(channel_name)]
        except (KeyError, ValueError):
            pass

    @gen.engine
    def _send_posts_for_channels(self, channels):
        if type(channels).__name__ == 'NoneType':
            channels = [DEFAULT_CHANNEL_KEY]

        # collect post ids
        posts = []
        for channel in channels:
            if channel is DEFAULT_CHANNEL_KEY:
                posts += ((yield gen.Task(redis_client.lrange, 'posts', 0, INITIAL_POSTS_COUNT-1)))
            else:
                posts += ((yield gen.Task(redis_client.lrange, 'posts:hashtag:%s' % (channel), 0, INITIAL_POSTS_COUNT-1)))

        # send sorted post ids
        for post_id in sorted(posts):
            post = yield gen.Task(redis_client.get, 'post:%s' % (post_id))
            if post: self.send(post)

    def on_open(self, request):
        # init
        WS_LISTENERS_CHANNELS.setdefault(self, [])

    def on_message(self, data):
        json_data = json_decode(data)
        available_commands = {
            'set_hashtag_filter': self._set_hashtag_filter,
        }
        available_commands.get(json_data.get('command'), lambda x: None)(json_data)

    def _set_hashtag_filter(self, json_data):
        hashtags = json_data.get('payload', [])

        # add to default channel if no hashtag was selected
        if not hashtags:
            self._send_posts_for_channels(DEFAULT_CHANNEL_KEY)
            self._add_client_to_channel(DEFAULT_CHANNEL_KEY)
            return

        # remove listener from default post channel if present
        self._remove_client_from_channel(None)

        # delete listener from removed hashtags
        for hashtag in [hashtag for hashtag in WS_LISTENERS_CHANNELS[self] if hashtag not in hashtags]:
            try:
                self._remove_client_from_channel(hashtag)
            except (IndexError, ValueError):
                pass

        # normalize hashtags
        for index, hashtag in enumerate(hashtags):
            hashtags[index] = hashtag.strip().lower()
            if hashtags[index].startswith('#'): hashtags[index] = hashtags[index][1:]

        # send old channel posts
        self._send_posts_for_channels(hashtags)

        for hashtag in hashtags:
            # if listener is already registered to a hashtag channel, do noting, else => add him to the channel
            try:
                WS_LISTENERS_CHANNELS[self][WS_LISTENERS_CHANNELS[self].index(hashtag)]
            except (IndexError, ValueError):
                # add listener to the hashtag channel
                self._add_client_to_channel(hashtag)

    def on_close(self):
        try:
            for hashtag in WS_LISTENERS_CHANNELS[self]:
                try:
                    del WS_CHANNEL_LISTENERS[WS_CHANNEL_LISTENERS[hashtag].index(self)]
                except (KeyError, ValueError):
                    pass
        except KeyError:
            pass

        try:
            del WS_LISTENERS_CHANNELS[self]
        except KeyError:
            pass


class IndexHandler(web.RequestHandler):
    def get(self,):
        self.render('posts.html')


class LegalInformationHandler(web.RequestHandler):
    def get(self):
        self.render('legal_information.html')


class ManagementHandler(web.RequestHandler):
    @web.asynchronous
    def post(self):
        if self.request.remote_ip != '127.0.0.1': raise web.HTTPError(401,
            'Only connections from localhost are allowed')

        available_commands = {
            'send_post_to_listeners': self._send_post_to_listeners,
        }

        command = self.get_argument('command')
        if command not in available_commands: raise web.HTTPError(500, 'command "%s" not defined' % (command))
        available_commands.get(command, None)()

    def _send_post_to_listeners(self):
        hashtags = json_decode(self.get_argument('hashtags'))

        # send to default channel listeners
        for listener in WS_CHANNEL_LISTENERS.get(DEFAULT_CHANNEL_KEY, []):
            listener.send(self.get_argument('post'))

        for hashtag in hashtags:
            for listener in WS_CHANNEL_LISTENERS.get(hashtag, []):
                listener.send(self.get_argument('post'))

        self.finish()
