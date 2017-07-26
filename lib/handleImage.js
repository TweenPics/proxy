"use strict";

const config = require( "./config" );
const get = require( "./get" );
const sharp = require( "sharp" );

const contentTypes = new Map( [
	[ "gif", "image/gif" ],
	[ "jpeg", "image/jpeg" ],
	[ "png", "image/png" ],
	[ "webp", "image/webp" ]
] );

module.exports = ( { headers, url, path, response } ) => {
	// Handle 304
	if ( headers[ "if-none-match" ] ) {
		response.writeHead( 304, {} );
		response.end();
		return;
	}
	config.then( ( { authent, origin } ) =>
		get( { url } )
		.then( ( { buffer } ) => sharp( buffer ) )
		.then(
			image => image.metadata().then(
				( { format, hasAlpha, height, width } ) => {
					if ( !contentTypes.has( format ) ) {
						throw `unsupported format ${format}`;
					}
					return { hasAlpha, height, image, width };
				}
			)
		)
		.then(
			( { hasAlpha, height, image, width } ) =>
			get.json( {
				headers,
				url: `${origin}${path}/proxy:${width}x${height}${hasAlpha ? "+alpha" : ""}@${authent}`
			} )
			.then(
				( {
					headers,
					json: {
						actions,
						format
					}
				} ) =>
					actions
					.reduce(
						( image, { type, x, y, width, height } ) => {
							if ( type === "crop" ) {
								image = image.extract( {
									left: x,
									top: y,
									width,
									height
								} );
							} else if ( type === "resize" ) {
								image = image.resize( width, height );
							}
							return image;
						},
						image
					)
					[ format.type ]( format )
					.toBuffer()
					.then( buffer => ( { buffer, headers, type: format.type } ) )
				)
		)
		.then( ( { buffer, headers, type } ) => {
			headers[ "content-type" ] = contentTypes.get( type );
			headers[ "content-length" ] = buffer.length;
			response.writeHead( 200, headers );
			response.end( buffer );
		} )
		.catch( error => {
			console.error( error );
			response.statusCode = 500;
			response.end( error.toString() );
		} )
	);
};
