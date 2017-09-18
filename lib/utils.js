"use strict";

const { ensureDir } = require( `fs-extra` );
const path = require( `path` );
const parseUrl = require( `url` ).parse;
const readFile = require( `fs` ).readFileSync;
const request = require( `request` );
const { tmpdir } = require( `os` );

const isWindows = path.sep === `\\`;

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
                reject( error );
            } else {
                const { statusCode, "headers": responseHeaders } = response;
                if ( statusCode === 200 ) {
                    resolve( {
                        buffer,
                        responseHeaders,
                    } );
                } else {
                    reject( new Error( `unexpected status code ${ statusCode }` ) );
                }
            }
        } );
    }
} );

get.json = options => get( options ).then( ( { buffer, responseHeaders } ) => ( {
    "json": JSON.parse( buffer.toString() ),
    responseHeaders,
} ) );

const ensureDirectory = async ( ...paths ) => {
    const directory = path.resolve( path.join( tmpdir(), `.tweenpics-proxy`, ...paths ) );
    await ensureDir( directory );
    return directory;
};

module.exports = {
    ensureDirectory,
    get,
    parseUrl,
};