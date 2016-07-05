"use strict";

const config = require( "./lib/config" );
const handleImage = require( "./lib/handleImage" );
const launcher = require( "james-browser-launcher" );
const parseUrl = require( "url" ).parse;
const proxy = require( "./lib/proxy" );

const rAuth = /^auth:[^\/]\//;
const rImage = /\/((?:auth|https?|file):.+)$/;
const rTweenPics = /^http:\/\/i[1-5]?\.tween\.pics(?::80)?$|^https:\/\/i[1-5]?\.tween\.pics(?::443)?$/;

config.then(
	( { browser, cert, key, origin, port, start } ) =>
		proxy( {
			port,
			key,
			cert,
			isHandled: url => rTweenPics.test( url ),
			handle: ( { url, headers }, response ) => {
				let { path, hash } = parseUrl( url );
				url = undefined;
				path = ( path || "" ).replace(
					rImage,
					( _, found ) => {
						url = found.replace( rAuth, "" ) + ( hash || "" );
						return "";
					}
				);
				if ( !url ) {
					return origin;
				}
				handleImage( { headers, url, path, response } );
			}
		} ).then(
			proxy => launcher(
				( error, launch ) => {
					if ( error ) {
						console.error( "something went wrong:", error.toString() );
						process.exit( -1 );
					}
					launch( start, { browser, proxy }, ( error, instance ) => {
						if ( error ) {
							console.error( "something went wrong:", error.toString() );
							process.exit( -1 );
						}
						console.log( "browser started with PID:", instance.pid );
						instance.on( "stop", code => {
							console.log( "browser stopped with exit code:", code );
							process.exit( code );
						} );
					} );
				}
			)
		)
);
