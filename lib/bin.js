#!/usr/bin/env node

"use strict";

const commandLineConfig = require( `./commandLineConfig` );
const createProxyServer = require( `./createProxyServer` );
const launchers = require( `./launchers` );

( async () => {
    try {
        const config = await commandLineConfig();
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
