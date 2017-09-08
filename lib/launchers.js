"use strict";

const { ensureDir } = require( `fs-extra` );
const { spawn } = require( `child_process` );
const { tmpdir } = require( `os` );

const baseProfilePath = `${ tmpdir() }/.tweepics-proxy-profiles`;

const launcherFactory = ( id, karmaModule, karmaId, optionsGenerator ) => () => {
    const [ , KarmaClass ] = require( `karma-${ karmaModule }-launcher` )[ `launcher:${ karmaId }` ];
    const { DEFAULT_CMD, ENV_CMD } = KarmaClass.prototype;
    const command = process.env[ ENV_CMD ] || DEFAULT_CMD[ process.platform ];
    if ( !command ) {
        return Promise.reject( new Error( `Cannot find executable for ${ id }` ) );
    }
    const profilePath = `${ baseProfilePath }/${ id }`;
    return ensureDir( profilePath )
        .then( () => ( url, proxy, handlers ) => {
            let child;
            const toInject = new Map( [
                [ `args`, optionsGenerator( profilePath, proxy ) ],
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
            karmaLauncher._start( url );
            if ( handlers ) {
                for ( const key in handlers ) {
                    if ( handlers.hasOwnProperty( key ) ) {
                        child.on( key, handlers[ key ] );
                    }
                }
            }
            return child;
        } );
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
        ( profilePath, { IP, PORT } ) => ( {
            "chromeDataDir": profilePath,
            "flags": [ ` --proxy-server=http=${ IP }:${ PORT };https=${ IP }:${ PORT }` ],
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
        ( profilePath, { IP, PORT } ) => ( {
            "profile": profilePath,
            "prefs": {
                "network.proxy.http": IP,
                "network.proxy.http_port": PORT,
                "network.proxy.ssl": IP,
                "network.proxy.ssl_port": PORT,
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
