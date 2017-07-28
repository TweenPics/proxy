#!/usr/bin/env node

"use strict";

const config = require( `./lib/config` );
const handleImage = require( `./lib/handleImage` );
const launcher = require( `james-browser-launcher` );
const parseUrl = require( `url` ).parse;
const proxy = require( `./lib/proxy` );

const rAuth = /^auth:[^/]\//;
const rImage = /\/((?:auth|https?|file):.+)$/;
const rTweenPics = /^http:\/\/i[1-5]?\.tween\.pics(?::80)?$|^https:\/\/i[1-5]?\.tween\.pics(?::443)?$/;
const proxyPath = `/proxy`;

let insecureAccepted = false;

config.then(
    ( { browser, cert, key, origin, port, start } ) =>
        proxy( {
            port,
            key,
            cert,
            "isHandled": url => rTweenPics.test( url ),
            "handle": ( { url, headers }, response ) => {
                let { path, hash } = parseUrl( url );
                if ( path === proxyPath ) {
                    if ( !insecureAccepted ) {
                        insecureAccepted = true;
                        console.log( `insecure https for i.tween.pics accepted` );
                    }
                    return {
                        "redirect": start,
                    };
                }
                url = undefined;
                path = ( path || `` ).replace(
                    rImage,
                    ( _, found ) => {
                        url = found.replace( rAuth, `` ) + ( hash || `` );
                        return ``;
                    }
                );
                if ( !url ) {
                    return origin;
                }
                handleImage( {
                    headers,
                    url,
                    path,
                    response,
                } );
                return undefined;
            },
        } ).then(
            proxy => launcher(
                ( error, launch ) => {
                    if ( error ) {
                        console.error( `something went wrong:`, error.toString() );
                        process.exit( -1 );
                    }
                    launch( `https://i.tween.pics${ proxyPath }`, {
                        browser,
                        proxy,
                    }, ( launchError, instance ) => {
                        if ( launchError ) {
                            console.error( `something went wrong:`, launchError.toString() );
                            process.exit( -1 );
                        }
                        console.log( `browser started with PID:`, instance.pid );
                        if ( !insecureAccepted ) {
                            console.log( `please accept insecure https for i.tween.pics...` );
                        }
                        instance.on( `stop`, code => {
                            console.log( `browser stopped with exit code:`, code );
                            process.exit( code );
                        } );
                    } );
                }
            )
        )
);
