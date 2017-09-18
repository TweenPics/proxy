"use strict";

const { ensureDir } = require( `fs-extra` );
const { join, resolve, sep } = require( `path` );
const parseUrl = require( `url` ).parse;
const { readFile } = require( `fs` );
const request = require( `request` );
const { tmpdir } = require( `os` );

const isWindows = sep === `\\`;

const rSlash = /^\/+/;

const get = ( { headers, url } ) => new Promise( ( fulfill, reject ) => {
    const { protocol, path } = parseUrl( url );
    if ( protocol === `file:` ) {
        readFile( isWindows ? path.replace( rSlash, `` ) : path, buffer => fulfill( {
            buffer,
            "headers": {},
        } ) );
    } else {
        request( {
            url,
            headers,
            "encoding": null,
        }, ( error, response, buffer ) => {
            if ( error ) {
                reject( error );
            } else {
                const { statusCode, "headers": responseHeaders } = response;
                if ( statusCode === 200 ) {
                    fulfill( {
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
    const directory = resolve( join( tmpdir(), `.tweenpics-proxy`, ...paths ) );
    await ensureDir( directory );
    return directory;
};

module.exports = {
    ensureDirectory,
    get,
    parseUrl,
};
