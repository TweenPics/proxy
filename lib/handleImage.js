"use strict";

const { authent, origin } = require( `./config` );
const get = require( `./get` );
const sharp = require( `sharp` );

const contentTypes = new Map( [
    [ `gif`, `image/gif` ],
    [ `jpeg`, `image/jpeg` ],
    [ `png`, `image/png` ],
    [ `webp`, `image/webp` ],
] );

module.exports = ( { headers, url, path, response } ) => {
    // handle 304
    if ( headers[ `if-none-match` ] ) {
        response.writeHead( 304, {} );
        response.end();
        return;
    }
    get( {
        url,
    } )
        .then( ( { buffer } ) => sharp( buffer ) )
        .then(
            image => image.metadata().then(
                ( { format, hasAlpha, height, width } ) => {
                    if ( !contentTypes.has( format ) ) {
                        throw new Error( `unsupported format ${ format }` );
                    }
                    return {
                        hasAlpha,
                        height,
                        image,
                        width,
                    };
                }
            )
        )
        .then(
            ( { hasAlpha, "height": H, image, "width": W } ) =>
                get.json( {
                    headers,
                    "url":
                    `${ origin }${ path }/proxy:${ W }x${ H }${ hasAlpha ? `+alpha` : `` }@${ authent }`,
                } ).then(
                    ( { "json": { actions, format }, responseHeaders } ) =>
                        actions
                            .reduce(
                                ( imageInstance, { type, x, y, width, height } ) => {
                                    if ( type === `crop` ) {
                                        return imageInstance.extract( {
                                            "left": x,
                                            "top": y,
                                            width,
                                            height,
                                        } );
                                    }
                                    if ( type === `resize` ) {
                                        return imageInstance.resize( width, height );
                                    }
                                    return imageInstance;
                                },
                                image
                            )[ format.type ]( format )
                            .toBuffer()
                            .then( buffer => ( {
                                buffer,
                                responseHeaders,
                                "type": format.type,
                            } ) )
                )
        )
        .then( ( { buffer, responseHeaders, type } ) => {
            responseHeaders[ `content-type` ] = contentTypes.get( type );
            responseHeaders[ `content-length` ] = buffer.length;
            responseHeaders[ `etag` ] = `"proxy"`;
            response.writeHead( 200, responseHeaders );
            response.end( buffer );
        } )
        .catch( error => {
            console.error( error );
            response.statusCode = 500;
            response.end( error.toString() );
        } );
};
