"use strict";

const parseUrl = require( `url` ).parse;
const readFile = require( `fs` ).readFileSync;
const request = require( `request` );

const isWindows = require( `path` ).sep === `\\`;
const rSlash = /^\/+/;

const get = ( { headers, url } ) => new Promise( ( resolve, reject ) => {
    const { protocol, path } = parseUrl( url );
    if ( protocol === `file:` ) {
        resolve( {
            "buffer": readFile( isWindows ? path.replace( rSlash, `` ) : path ),
            "headers": {},
        } );
    } else {
        request( {
            url,
            headers,
            "encoding": null,
        }, ( error, response, buffer ) => {
            if ( error ) {
                console.log( url, `ERROR` );
                return reject( error );
            }
            const { statusCode, headers } = response;
            if ( statusCode === 200 ) {
                resolve( {
                    buffer,
                    headers,
                } );
            } else {
                reject( new Error( `unexpected status code ${ statusCode }` ) );
            }
        } );
    }
} );

get.json = options => get( options ).then( ( { buffer, headers } ) => ( {
    headers,
    "json": JSON.parse( buffer.toString() ),
} ) );

module.exports = get;
