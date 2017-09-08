#!/usr/bin/env node

"use strict";

const { browser, cert, key, origin, port, start } = require( `./lib/config` );
const handleImage = require( `./lib/handleImage` );
const launchers = require( `./lib/launchers` );
const parseUrl = require( `url` ).parse;
const proxy = require( `./lib/proxy` );

const rAuth = /^auth:[^/]\//;
const rImage = /\/((?:auth|https?|file):.+)$/;
const rTweenPics = /^http:\/\/i[1-5]?\.tween\.pics(?::80)?$|^https:\/\/i[1-5]?\.tween\.pics(?::443)?$/;
const proxyPath = `/proxy`;

let insecureAccepted = false;

launchers
    .get( browser )
    .then( launch =>
        proxy( {
            port,
            key,
            cert,
            "isHandled": url => rTweenPics.test( url ),
            "handle": ( { url, headers }, response ) => {
                let actualUrl = parseUrl( url );
                const { hash } = actualUrl;
                let { path } = actualUrl;
                actualUrl = undefined;
                if ( path === proxyPath ) {
                    if ( !insecureAccepted ) {
                        insecureAccepted = true;
                        console.log( `insecure https for i.tween.pics accepted` );
                    }
                    return {
                        "redirect": start,
                    };
                }
                path = ( path || `` ).replace(
                    rImage,
                    ( _, found ) => {
                        actualUrl = found.replace( rAuth, `` ) + ( hash || `` );
                        return ``;
                    }
                );
                if ( !actualUrl ) {
                    return origin;
                }
                handleImage( {
                    headers,
                    "url": actualUrl,
                    path,
                    response,
                } );
                return undefined;
            },
        } )
            .then( proxyInfo =>
                launch( `https://i.tween.pics${ proxyPath }`, proxyInfo, {
                    "close": code => {
                        console.log( `browser stopped with exit code:`, code );
                        process.exit( code );
                    },
                } )
            )
            .then( processInstance => {
                console.log( `browser started with PID:`, processInstance.pid );
                if ( !insecureAccepted ) {
                    console.log( `please accept insecure https for i.tween.pics...` );
                }
            } )
    )
    .catch( error => {
        console.error( `something went wrong:`, error.toString() );
        process.exit( -1 );
    } );
