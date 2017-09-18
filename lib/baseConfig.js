"use strict";

const { resolve } = require( `path` );
const { readFile } = require( `fs` );

const readCredentialsFile = type => new Promise(
    ( fulfill, reject ) =>
        readFile(
            resolve( __dirname, `credentials`, `.${ type }` ),
            ( error, content ) => ( error ? reject( error ) : fulfill( content ) )
        )
);

const credentials = Promise.all( [
    readCredentialsFile( `cert` ),
    readCredentialsFile( `key` ),
] ).then( ( [ cert, key ] ) => ( {
    cert,
    key,
} ) );

module.exports = async () => ( {
    "authent": require( `#authent` ),
    "browser": require( `#browser` ),
    "credentials": await credentials,
    "origin": require( `#origin` ),
    "start": require( `#start` ),
} );
