# -*- coding: utf-8 -*-

CFG_APPNET_TOKEN = '' # put your app.net token here
CFG_TORNDO_SERVER_URL = 'http://localhost:9000/management/'
CFG_LAST_FETCHED_POST_ID_KEY = 'config:last_saved_post_id'
CFG_EXPIRE_SECONDS =  60*60*24*365*100 # seconds to keep posts etc in redis cache
CFG_API_FETCH_COUNT = 200

CFG_REDIS_SERVER = 'localhost'
CFG_REDIS_PORT = 6379