"use strict";

const { get } = require( `./utils` );
const sharp = require( `sharp` );

const rAuth = /^auth:[^/]\//;
const rImage = /\/((?:auth|https?|file):.+)$/;

const contentTypes = new Map( [
    [ `gif`, `image/gif` ],
    [ `jpeg`, `image/jpeg` ],
    [ `png`, `image/png` ],
    [ `webp`, `image/webp` ],
] );

module.exports = ( { authent, origin }, { hash, "path": originalPath }, headers, response ) => {
    let url;
    const path = ( originalPath || `` ).replace(
        rImage,
        ( _, found ) => {
            url = found.replace( rAuth, `` ) + ( hash || `` );
            return ``;
        }
    );
    if ( !url ) {
        return origin;
    }
    // handle 304
    if ( headers[ `if-none-match` ] ) {
        response.writeHead( 304, {} );
        response.end();
        return undefined;
    }
    ( async () => {
        try {
            const image = sharp( ( await get( {
                url,
            } ) ).buffer );
            const { format, hasAlpha, "height": H, "width": W } = await image.metadata();
            if ( !contentTypes.has( format ) ) {
                throw new Error( `unsupported format ${ format }` );
            }
            const { "json": { actions, "format": outputFormat }, responseHeaders } = await get.json( {
                headers,
                "url": `${ origin }${ path }/proxy:${ W }x${ H }${ hasAlpha ? `+alpha` : `` }@${ authent }`,
            } );
            const { "type": outputType } = outputFormat;
            const buffer = await (
                actions.reduce(
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
                )[ outputType ]( outputFormat )
            ).toBuffer();
            responseHeaders[ `content-type` ] = contentTypes.get( outputType );
            responseHeaders[ `content-length` ] = buffer.length;
            response.writeHead( 200, responseHeaders );
            response.end( buffer );
        } catch ( error ) {
            response.statusCode = 500;
            response.end( `${ error.toString() }\n${ error.stack }` );
        }
    } )();
    return undefined;
};
