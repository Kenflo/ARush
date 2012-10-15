# ARush

ARush is a #hashtag filterable post wall for the [App.net](https://alpha.app.net/) platform

## Demo
[view](http://aru.sh)

## Installation

### Install and start Redis

### Create virtualenv python env

    virtualenv --no-site-packages virtualenv

### Switch into created virtualenv

    source ./virtualenv/bin/activate

### Install python requirements in a virtualenv

    pip install -r requirements.txt

### Edit settings.py and your torndo websocket server in static/js/config.coffee (websocketServerURL)

### Run tornado web and socketserver

    arush/server.py

### Start post collector

    arush/collector.py

## License

[MIT](https://raw.github.com/ierror/ARush/development/LICENSE)

## Contact

*  [boerni@App.net](https://alpha.app.net/boerni)

### Enjoy!