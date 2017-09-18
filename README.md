# TweenPics - Proxy

TODO: much better and verbose documentation

## What is it?

The TweenPics proxy makes it possible to use the full power of TweenPics in a development environment. It creates a local web server that will pass requests to the main TweenPics servers while granting them access to your local image files.

## Install

`npm install -g @tweenpics/proxy`

## Usage

```
  Usage: tweenpics-proxy [options]

  Proxy server to work with TweenPics locally

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -a, --authent [token]  specify authentication token
    -b, --browser [name]   specify the browser to open (chrome)
    -s, --start [url]      specify start-up page
```

## Options

- _-a, --authent [token]_ (`String`, no default): this is the TweenPics authentication token.
- _-b, --browser [name]_ (`String`, default `"chrome"`): name of the browser to proxy. The proxy will automatically open the browser with a fresh profile.
- _-s, --start [url]_ (`String`, default `https://www.tweenpics.com`): this is the page that should be loaded by the browser when launched. The proxy does support the `file:` protocol, so feel free to use local urls if needed.

## Overriding options with environment variables

- _TWEENPICS_AUTHENT_ can be used to override the authentication token.
