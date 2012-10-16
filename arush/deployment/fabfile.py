# -*- coding: utf-8 -*-
from fabric.api import env, roles, run, sudo, cd
from fabric.contrib import files
from env_production import APPNET_TOKEN, WEBSOCKET_SERVER_URL, TORNDO_MGMT_SERVER_URL


REMOTE_REPO_PATH = '/opt/arush/www/'

env.user = 'root'

# Define sets of servers as roles
env.roledefs = {
    'production_web': ['46.252.16.97'],
}

@roles('production_web')
def deploy_production():
    def _sudo(command, *args, **kwargs):
        sudo(command, user='www-data', *args, **kwargs)

    # stop services
    run('supervisorctl stop arush_collector')
    run('supervisorctl stop arush_server')

    _sudo('cd %s; git reset --hard production && git pull' % (REMOTE_REPO_PATH))

    # install venv python modules
    _sudo('cd %s; source virtualenv/bin/activate; pip install -r requirements.txt' % (REMOTE_REPO_PATH))

    # replace websocket url
    files.sed('%sarush/static/js/config.js' % (REMOTE_REPO_PATH), "http://localhost:9000/ws", WEBSOCKET_SERVER_URL)

    # replace adn token
    files.sed('%sarush/settings.py' % (REMOTE_REPO_PATH), "^CFG_APPNET_TOKEN.*", 'CFG_APPNET_TOKEN = \"%s\"' % (APPNET_TOKEN))

    # replace mgmt url
    files.sed('%sarush/settings.py' % (REMOTE_REPO_PATH), "^CFG_TORNDO_MGMT_SERVER_URL.*", 'CFG_TORNDO_MGMT_SERVER_URL = \"%s\"' % (TORNDO_MGMT_SERVER_URL))

    # start services
    run('supervisorctl start arush_server')
    run('supervisorctl start arush_collector')
