"use strict";

const parseUrl = require( "url" ).parse;
const readFile = require( "fs" ).readFileSync;
const request = require( "request" );

const isWindows = require( "path" ).sep === "\\";
const rSlash = /^\/+/;

const get = ( { headers, url } ) => new Promise( ( resolve, reject ) => {
	const { protocol, path } = parseUrl( url );
	if ( protocol === "file:" ) {
		resolve( readFile( isWindows ? path.replace( rSlash, "" ) : path ) );
	} else {
		request( {
			url,
			headers,
			encoding: null
		}, ( error, { statusCode, headers }, buffer ) => {
			if ( error ) {
				reject( error );
			} else if ( statusCode !== 200 ) {
				reject( `unexpected status code ${statusCode}` );
			} else {
				resolve( { buffer, headers } );
			}
		} );
	}
} );

get.json = options => get( options ).then( ( { buffer, headers } ) => ( {
	headers,
	json: JSON.parse( buffer.toString() )
} ) );

module.exports = get;
