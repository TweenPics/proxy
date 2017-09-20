#!/usr/bin/env node

"use strict";

const { baseConfig, createProxyServer, launchers, validateAuthent } = require( `@tweenpics/proxy-internal` );
const packageInfo = require( `./package` );
const program = require( `commander` );

const rLineStart = /^/gm;

const log = string => process.stdout.write( `${ string.replace( rLineStart, `  ` ) }\n` );
const error = string => process.stderr.write( `${ string.replace( rLineStart, `  ` ) }\n` );

const outputDefault = value => ( value ? `\n                       (${ value })` : `` );

const getCommandLineConfig = async () => {

    const config = await baseConfig();
    const launchersCollection = await launchers;

    const browserExplainer = errorMessage => {
        const list = ( exists, intro, noneMessage = `` ) => {
            const array = launchersCollection.getAll( exists ).filter( ( { installable } ) => installable );
            const message = array.map( ( { id, name } ) => `- ${ id } (${ name })` ).join( `\n` );
            return message ? `\n${ intro }\n\n${ message }` : noneMessage && `\n${ noneMessage }`;
        };
        return ( errorMessage ? `${ errorMessage }\n` : `` ) +
            list(
                true,
                `browsers installed:`,
                `no known browser installed!`
            ) +
            list(
                false,
                `\nyou could install and then use:`
            );
    };

    program
        .version( packageInfo.version )
        .description( packageInfo.description )
        .option( `-a, --authent [token]`, `specify authentication token${ outputDefault( config.authent ) }` )
        .option( `-b, --browser [name]`, `specify the browser to open (${ config.browser })` )
        .option( `-s, --start [url]`, `specify start page${ outputDefault( config.start ) }` )
        .on( `--help`, () => {
            log( `\n${ browserExplainer() }` );
        } )
        .parse( process.argv );

    if ( program.args.length ) {
        error( `\nunexpected arguments` );
        program.outputHelp();
        process.exit( 1 );
    }

    [ `authent`, `browser`, `start` ].forEach( key => ( config[ key ] = program[ key ] || config[ key ] ) );

    if ( !config.authent ) {
        error( `\nauthentification token required` );
        program.outputHelp();
        process.exit( 1 );
    }

    if ( !validateAuthent( config.authent ) ) {
        error( `\n${ config.authent } is not a valid authentification token` );
        process.exit( 2 );
    }

    if ( !config.browser ) {
        error( await browserExplainer( `\nbrowser is required` ) );
        process.exit( 1 );
    }

    try {
        config.launcher = launchersCollection.get( config.browser );
    } catch ( launcherError ) {
        error( browserExplainer( `\n${ launcherError.message }` ) );
        process.exit( 2 );
    }

    return config;
};

( async () => {
    try {
        const config = await getCommandLineConfig();
        const { browser, launcher, start } = config;
        const proxyServer = createProxyServer( config );
        log( `\nproxy server listening on port #${ proxyServer.port }` );
        launcher(
            start,
            proxyServer,
            {
                "close": code => {
                    log( `${ browser } stopped with exit code ${ code }` );
                    process.exit( code );
                },
                "created": pid => {
                    log( `${ browser } started with pid #${ pid }` );
                    log( `please accept unsecured https://i.tween.pics` );
                },
                "unsecuredAccepted": () => log( `unsecured https://i.tween.pics accepted` ),
            }
        );
    } catch ( e ) {
        error( `\nsomething went wrong: ${ e.toString() }` );
        process.exit( -1 );
    }
} )();
