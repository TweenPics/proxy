"use strict";

const http = require( `http` );
const httpProxy = require( `http-proxy` );
const https = require( `https` );
const parseUrl = require( `url` ).parse;
const { Socket } = require( `net` );

module.exports = ( { cert, handle, isHandled, key, port } ) => {
    const tweenpicsPort = port + 1;
    const passthrough = httpProxy.createProxyServer().on( `error`, ( error, request, response ) => {
        if ( response.headersSent ) {
            response.end();
        } else {
            response.statusCode = 502;
            response.end( JSON.stringify( error, null, `  ` ) );
        }
    } );
    const httpPromise = new Promise( resolve =>
        http.createServer( ( request, response ) => {
            let target = `http://${ request.headers.host }`;
            if ( isHandled( target ) ) {
                target = handle( request, response );
            }
            if ( target ) {
                passthrough.web( request, response, {
                    target,
                } );
            }
        } )
            .on( `connect`, ( request, socket, head ) => {
                const proxySocket = ( new Socket() )
                    .on( `data`, chunk => socket.write( chunk ) )
                    .on( `end`, () => socket.end() )
                    .on( `error`, () => {
                        socket.write( `HTTP/${ request.httpVersion } 500 Connection error\r\n\r\n` );
                        socket.end();
                    } );
                socket
                    .on( `data`, chunk => proxySocket.write( chunk ) )
                    .on( `end`, () => proxySocket.end() )
                    .on( `error`, () => proxySocket.end() );
                const target = `https://${ request.headers.host }`;
                const { hostname, port } = isHandled( target ) ? {
                    "hostname": `localhost`,
                    "port": tweenpicsPort,
                } : parseUrl( target );
                proxySocket.connect( port || 443, hostname, () => {
                    proxySocket.write( head );
                    socket.write( `HTTP/${ request.httpVersion } 200 Connection established\r\n\r\n` );
                } );
            } )
            .listen( port, () => {
                console.log( `proxy listening on port ${ port }` );
                resolve();
            } )
    );
    const httpsPromise = new Promise( resolve =>
        https.createServer( {
            key,
            cert,
        }, ( request, response ) => {
            const target = handle( request, response );
            if ( target ) {
                if ( target.redirect ) {
                    response.writeHead( 307, {
                        "location": target.redirect,
                    } );
                    response.end();
                } else {
                    passthrough.web( request, response, {
                        target,
                    } );
                }
            }
        } )
            .listen( tweenpicsPort, () => {
                console.log( `local tweenpics listening on port ${ tweenpicsPort }` );
                resolve();
            } ) );
    return Promise.all( [ httpPromise, httpsPromise ] ).then( () => ( {
        "IP": `localhost`,
        "PORT": port,
    } ) );
};
