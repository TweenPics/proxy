#!/usr/bin/env node

"use strict";

const { baseConfig, createProxyServer, launchers } = require( `@tweenpics/proxy-internal` );
const packageInfo = require( `./package` );
const program = require( `commander` );

const outputDefault = value => ( value ? `\n                       (${ value })` : `` );

const getCommandLineConfig = async () => {

    const config = await baseConfig();

    program
        .version( packageInfo.version )
        .description( packageInfo.description )
        .option( `-a, --authent [token]`, `specify authentication token${ outputDefault( config.authent ) }` )
        .option( `-b, --browser [name]`, `specify the browser to open (${ config.browser })` )
        .option( `-s, --start [url]`, `specify start page${ outputDefault( config.start ) }` )
        .parse( process.argv );

    if ( program.args.length ) {
        console.error( `unexpected arguments` );
        program.outputHelp();
        process.exit( 1 );
    }

    [ `authent`, `browser`, `start` ].forEach( key => ( config[ key ] = program[ key ] || config[ key ] ) );

    if ( !config.authent ) {
        console.error( `authentification token required` );
        program.outputHelp();
        process.exit( 1 );
    }

    if ( !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}$/.test( config.authent ) ) {
        console.error( `authentification token "${ config.authent }" is invalid` );
        process.exit( 2 );
    }

    if ( !config.browser ) {
        console.error( `browser is required` );
        process.exit( 1 );
    }

    if ( !launchers.exists( config.browser ) ) {
        console.error(
            `browser "${ config.browser }" is not a valid browser name.\n\nvalid browser names are:\n${
                launchers
                    .getExisting()
                    .map( name => `- ${ name }` )
                    .join( `\n` )
            }`
        );
        process.exit( 2 );
    }

    return config;
};

( async () => {
    try {
        const config = await getCommandLineConfig();
        const launch = await launchers.get( config.browser );
        const proxyServer = createProxyServer( config );
        console.log( `proxy server listening on port #${ proxyServer.port }` );
        launch(
            config.start,
            proxyServer,
            {
                "close": code => {
                    console.log( `browser stopped with exit code ${ code }` );
                    process.exit( code );
                },
                "created": pid => {
                    console.log( `${ config.browser } started with pid #${ pid }` );
                    console.log( `please accept insecure https://i.tween.pics !` );
                },
                "unsecuredAccepted": () => console.log( `unsecured https://i.tween.pics accepted.` ),
            }
        );
    } catch ( error ) {
        console.error( `something went wrong: ${ error.toString() }` );
        process.exit( -1 );
    }
} )();
