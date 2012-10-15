#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
from tornado import ioloop, web
from tornado.httpserver import HTTPServer
from sockjs.tornado.router import SockJSRouter
from tornado.options import define, options, parse_command_line
from handlers import WebSocketHandler, IndexHandler, LegalInformationHandler, ManagementHandler


# define Tornado defaults
define('port', default=9000, metavar='9000', help='run on the given port', type=int)
define('address', default='0.0.0.0', metavar='0.0.0.0', help='bind on the given address', type=str)
define('debug', default=0, metavar='1', help='turn debug mode on', type=int)


class Application(web.Application):
    def __init__(self):
        if options.address == '*':
            options.address = '0.0.0.0'

        app_settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), 'templates'),
            static_path=os.path.join(os.path.dirname(__file__), 'static'),
            debug=options.debug,
        )

        handlers = [
            (r'^/$', IndexHandler),
            (r'^/management/?$', ManagementHandler),
            (r'^/legal_information/?$', LegalInformationHandler),
        ]
        super(Application, self).__init__(
            handlers=handlers + SockJSRouter(WebSocketHandler, '/ws').urls,
            **app_settings
        )

if __name__ == '__main__':
    parse_command_line()
    http_server = HTTPServer(Application())
    http_server.listen(options.port, options.address)
    ioloop.IOLoop.instance().start()
