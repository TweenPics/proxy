# TweenPics - Proxy

TODO: much better and verbose documentation

## What is it?

The TweenPics proxy makes it possible to use the full power of TweenPics in a development environment. It creates a local web server that will pass requests to the main TweenPics servers while granting them access to your local image files.

## Install

`npm install -g tweenpics-proxy`

## Usage

```
  Usage: tweenpics-proxy [options]

  Proxy server to work with TweenPics locally

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -a, --authent [token]  specify authentication token
    -b, --browser [name]   specify the browser to open (chrome)
    -p, --port [number]    specify port number for proxy (8080)
    -s, --start [url]      specify start-up page
```

## Options

- _-a, --authent [token]_ (`String`, no default): this is the TweenPics authentication token.
- _-b, --browser [name]_ (`String`, default `"chrome"`): name of the browser to proxy. The proxy will automatically open the browser with a fresh profile.
- _-p, --port [number]_ (`Integer`, default `8080`): this is the port the proxy will use on your local machine. The next port will also be used for internal purposes. For instance, if you set the port option to `8010` then the port `8011` will also be used.
- _-s, --start [url]_ (`String`, no default): this is the page that should be loaded by the browser when launched. By default, a blank page will appear. The proxy does support the `file:` protocol, so feel free to use local urls if needed.

## Overriding options with environment variables

- _TWEENPICS_AUTHENT_ can be used to override the authentication token.
