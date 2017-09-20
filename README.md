# TweenPics - Proxy

The TweenPics proxy bring the full power of TweenPics to your development environment.

## Install

You'll need Node.js version 8+ to use this tool.

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
    -l, --log [level]      log level: 0 = none, 1 = captured, 2 = all (0)
    -s, --start [url]      specify start-up page
```

## Options

- _-a, --authent [token]_ (`String`, no default): this is the TweenPics authentication token.
- _-b, --browser [name]_ (`String`, default `"chrome"`): name of the browser to proxy. The proxy will automatically open the browser with a fresh profile.
- _-l, --log [level]_ (`Integer`, default `0`): determines how much traffic the proxy will log (0 will log nothing, 1 will log what the proxy captures and 2 will log everything including what's not captured).
- _-s, --start [url]_ (`String`, default `https://www.tweenpics.com`): this is the page that should be loaded by the browser when launched. The proxy does support the `file:` protocol, so feel free to use local urls if needed.

## Supported browsers

- chrome (Google Chrome)
- chrome-canary (Google Chrome Canary)
- chromium (Chromium)
- dartium (Dartium)
- firefox (Mozilla Firefox)
- firefox-aurora (Mozilla Firefox Aurora)
- firefox-dev (Mozilla Firefox Developer Edition)
- firefox-nightly (Mozilla Firefox Nightly)

## Overriding options with environment variables

- _TWEENPICS_AUTHENT_ can be used to override the authentication token.
