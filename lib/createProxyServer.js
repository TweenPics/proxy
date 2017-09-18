"use strict";

const handleImage = require( `./handleImage` );
const http = require( `http` );
const httpProxy = require( `http-proxy` );
const https = require( `https` );
const { parseUrl } = require( `./utils` );
const { Socket } = require( `net` );
const uuid = require( `uuid/v4` );

const rTweenPics = /^http:\/\/i[1-5]?\.tween\.pics(?::80)?$|^https:\/\/i[1-5]?\.tween\.pics(?::443)?$/;

const passThrough =
    httpProxy
        .createProxyServer()
        .on( `error`, ( error, request, response ) => {
            if ( response.headersSent ) {
                response.end();
            } else {
                response.statusCode = 502;
                response.end( JSON.stringify( error, null, `  ` ) );
            }
        } );

module.exports = config => {
    const redirectors = new Map();
    const tweenPicsLocation = {
        "hostname": `localhost`,
        "port":
            https
                .createServer( config.credentials, ( request, response ) => {
                    const parsedUrl = parseUrl( request.url );
                    const { path } = parsedUrl;
                    const redirector = redirectors.get( path );
                    if ( redirector ) {
                        redirectors.delete( path );
                        const location = redirector();
                        response.writeHead( 307, {
                            location,
                        } );
                        response.end();
                    } else {
                        const target = handleImage( config, parsedUrl, request.headers, response );
                        if ( target ) {
                            passThrough.web( request, response, {
                                target,
                            } );
                        }
                    }
                } )
                .listen()
                .address().port,
    };
    return {
        "addRedirector": notifier => {
            let id;
            do {
                id = `/proxy/${ uuid() }`;
            } while ( redirectors.has( id ) );
            redirectors.set( id, notifier );
            return `https://i.tween.pics${ id }`;
        },
        "hostname": `localhost`,
        "port":
            http
                .createServer( ( request, response ) => {
                    const { headers } = request;
                    let target = `http://${ headers.host }`;
                    if ( rTweenPics.test( target ) ) {
                        target = handleImage( config, parseUrl( request.url ), headers, response );
                    }
                    if ( target ) {
                        passThrough.web( request, response, {
                            target,
                        } );
                    }
                } )
                .on( `connect`, ( request, socket, head ) => {
                    const { "headers": { host }, httpVersion } = request;
                    const target = `https://${ host }`;
                    const proxySocket =
                        ( new Socket() )
                            .on( `data`, chunk => socket.write( chunk ) )
                            .on( `end`, () => socket.end() )
                            .on( `error`, () => {
                                socket.write( `HTTP/${ httpVersion } 500 Connection error\r\n\r\n` );
                                socket.end();
                            } );
                    socket
                        .on( `data`, chunk => proxySocket.write( chunk ) )
                        .on( `end`, () => proxySocket.end() )
                        .on( `error`, () => proxySocket.end() );
                    const handle = () => {
                        proxySocket.write( head );
                        socket.write( `HTTP/${ httpVersion } 200 Connection established\r\n\r\n` );
                    };
                    const { hostname, port } = rTweenPics.test( target ) ? tweenPicsLocation : parseUrl( target );
                    proxySocket.connect( port || 443, hostname, handle );
                } )
                .listen()
                .address().port,
    };
};
