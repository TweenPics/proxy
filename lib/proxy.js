"use strict";

const handleImage = require( `./handleImage` );
const http = require( `http` );
const httpProxy = require( `http-proxy` );
const https = require( `https` );
const parseUrl = require( `url` ).parse;
const { Socket } = require( `net` );
const uuid = require( `uuid/v4` );

const rAuth = /^auth:[^/]\//;
const rImage = /\/((?:auth|https?|file):.+)$/;
const rTweenPics = /^http:\/\/i[1-5]?\.tween\.pics(?::80)?$|^https:\/\/i[1-5]?\.tween\.pics(?::443)?$/;

module.exports = class {
    constructor( { credentials, origin } ) {
        this._credentials = credentials;
        this._origin = origin;
        this._passthrough =
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
        this._pathsNotifiers = new Map();
    }
    attachNotifier( url, callback ) {
        let id;
        do {
            id = `proxy/${ uuid() }`;
        } while ( this._pathsNotifiers.has( id ) );
        this._pathsNotifiers.add( id, {
            callback,
            url,
        } );
        return `https://i.tween.pics/${ id }`;
    }
    async close() {
        await Promise.all( [
            this.setTweenPicsPort( false ),
            this.setProxyPort( false ),
        ] );
    }
    setTweenPicsPort( port ) {
        return this._setPort( `tweenPics`, port );
    }
    setProxyPort( port ) {
        return this._setPort( `proxy`, port );
    }
    _handle( { hash, path }, headers, response ) {
        let url;
        const cleansedPath = ( path || `` ).replace(
            rImage,
            ( _, found ) => {
                url = found.replace( rAuth, `` ) + ( hash || `` );
                return ``;
            }
        );
        if ( !url ) {
            return this._origin;
        }
        handleImage( {
            headers,
            url,
            "path": cleansedPath,
            response,
        } );
        return undefined;
    }
    _proxyStart() {
        return this.proxyPort && new Promise( ( resolve, reject ) => {
            const server = http
                .createServer( ( request, response ) => {
                    let target = `http://${ request.headers.host }`;
                    if ( rTweenPics.test( target ) ) {
                        target = this._handle( parseUrl( request.url ), request.headers, response );
                    }
                    if ( target ) {
                        this._passthrough.web( request, response, {
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
                    const { hostname, port } = rTweenPics.test( target ) ? {
                        "hostname": `localhost`,
                        "port": this._tweenpicsPort,
                    } : parseUrl( target );
                    proxySocket.connect( port || 443, hostname, () => {
                        proxySocket.write( head );
                        socket.write( `HTTP/${ request.httpVersion } 200 Connection established\r\n\r\n` );
                    } );
                } )
                .on( `error`, reject )
                .listen( this.proxyPort, () => {
                    resolve( server );
                } );
        } );
    }
    async _setPort( type, port ) {
        const promiseField = `_${ type }Server`;
        const portField = `_${ type }Port`;
        const { [ portField ]: currentPort, [ promiseField ]: serverPromise } = this;
        if ( currentPort === port ) {
            await serverPromise;
            return;
        }
        this[ portField ] = port;
        this[ promiseField ] = undefined;
        if ( serverPromise ) {
            try {
                const server = await serverPromise;
                await new Promise( resolve => server.close( resolve ) );
            } catch ( e ) {}
        }
        if ( this[ portField ] === port ) {
            await ( this[ promiseField ] = this[ `_${ type }Start` ]( port ) );
        }
    }
    _tweenpicsStart() {
        this._pathsNotifiers.empty();
        return this.tweenpicsPort && new Promise( ( resolve, reject ) => {
            const server = https
                .createServer( this._credentials, ( request, response ) => {
                    const parsedUrl = parseUrl( request.url );
                    const { path } = parsedUrl;
                    const notifier = this._pathsNotifiers.get( path );
                    if ( notifier ) {
                        this._pathsNotifiers.remove( path );
                        notifier.callback();
                        response.writeHead( 307, {
                            "location": notifier.url,
                        } );
                        return;
                    }
                    const target = this._handle( parsedUrl, request.headers, response );
                    if ( target ) {
                        this._passthrough.web( request, response, {
                            target,
                        } );
                    }
                } )
                .on( `error`, reject )
                .listen( this.tweenpicsPort, () => {
                    resolve( server );
                } );
        } );
    }
};
