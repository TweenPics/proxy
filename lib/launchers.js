"use strict";

const { ensureDirectory } = require( `./utils` );
const { spawn } = require( `child_process` );

const launcherFactory = ( id, karmaModule, karmaId, optionsGenerator ) => async () => {
    const [ , KarmaClass ] = require( `karma-${ karmaModule }-launcher` )[ `launcher:${ karmaId }` ];
    const { DEFAULT_CMD, ENV_CMD } = KarmaClass.prototype;
    const command = process.env[ ENV_CMD ] || DEFAULT_CMD[ process.platform ];
    if ( !command ) {
        return Promise.reject( new Error( `Cannot find executable for ${ id }` ) );
    }
    const profilePath = await ensureDirectory( `profiles`, id );
    return ( url, proxyServer, handlers ) => {
        let child;
        const toInject = new Map( [
            [ `args`, optionsGenerator( profilePath, proxyServer ) ],
            [
                `baseBrowserDecorator`, self => {
                    self._execCommand = ( cmd, flags ) => ( child = spawn( cmd, flags ) );
                    self._getCommand = () => command;
                    self._start = target => self._execCommand( self._getCommand(), self._getOptions( target ) );
                },
            ],
        ] );
        const parameters = KarmaClass.$inject.map( name => toInject.get( name ) );
        const karmaLauncher = new KarmaClass( ...parameters );
        karmaLauncher._start( proxyServer.addRedirector( () => {
            child.emit( `unsecuredAccepted` );
            return url;
        } ) );
        if ( handlers ) {
            for ( const key in handlers ) {
                if ( handlers.hasOwnProperty( key ) ) {
                    child.on( key, handlers[ key ] );
                }
            }
        }
        child.emit( `created`, child.pid );
    };
};

const launchers = new Map();

[
    [
        `chrome`,
        [
            [ `chrome`, `Chrome` ],
            [ `chrome-canary`, `ChromeCanary` ],
            [ `chromium`, `Chromium` ],
            [ `dartium`, `Dartium` ],
        ],
        ( profilePath, { hostname, port } ) => ( {
            "chromeDataDir": profilePath,
            "flags": [ ` --proxy-server=http=${ hostname }:${ port };https=${ hostname }:${ port }` ],
        } ),
    ],
    [
        `firefox`,
        [
            [ `firefox`, `Firefox` ],
            [ `firefox-aurora`, `FirefoxAurora` ],
            [ `firefox-dev`, `FirefoxDeveloper` ],
            [ `firefox-nightly`, `FirefoxNightly` ],
        ],
        ( profilePath, { hostname, port } ) => ( {
            "profile": profilePath,
            "prefs": {
                "network.proxy.http": hostname,
                "network.proxy.http_port": port,
                "network.proxy.ssl": hostname,
                "network.proxy.ssl_port": port,
                "network.proxy.type": 1,
            },
        } ),
    ],
].forEach( ( [ karmaModule, karmaIds, optionsGenerator ] ) =>
    karmaIds.forEach(
        ( [ id, karmaId ] ) => launchers.set( id, launcherFactory( id, karmaModule, karmaId, optionsGenerator ) )
    )
);

module.exports = {
    "exists": id => launchers.has( id ),
    "get": id => launchers.get( id )(),
    "getExisting": () => {
        const array = Array.from( launchers.keys() );
        array.sort();
        return array;
    },
};
