"use strict";

require( "wires" );

const packageInfo = require( "../package" );
const program = require( "commander" );
const readFile = require( "fs" ).readFileSync;

const outputDefault = value => value ? `\n                       (${value})` : "";

const config = {
	authent: require( "#authent" ),
	browser: require( "#browser" ),
	cert: readFile( `${__dirname}/../data/tweenpics.cert` ),
	key: readFile( `${__dirname}/../data/tweenpics.key` ),
	origin: require( "#origin" ),
	port: require( "#port" ),
	start: require( "#start" )
};

program
	.version( packageInfo.version )
	.description( packageInfo.description )
	.option( "-a, --authent [token]", `specify authentication token${outputDefault( config.authent )}` )
	.option( "-b, --browser [name]", `specify the browser to open (${config.browser})` )
	.option( "-p, --port [number]", `specify port number for proxy (${config.port})`, parseInt )
	.option( "-s, --start [url]", `specify start-up page${outputDefault( config.start )}` )
	.parse( process.argv );

if ( program.args.length ) {
	console.error( "unexpected arguments" );
	program.outputHelp();
	process.exit( 1 );
}

[ "authent", "browser", "port", "start" ].forEach( key => config[ key ] = program[ key ] || config[ key ] );

if ( !config.authent ) {
	console.error( "authentification token required" );
	program.outputHelp();
	process.exit( 1 );
}

if ( !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}$/.test( config.authent ) ) {
	console.error( `authentification token "${config.authent}" is invalid` );
	process.exit( 2 );
}

if ( !config.browser ) {
	console.error( `browser is required` );
	process.exit( 1 );
}

module.exports = new Promise( resolve => {
	require( "james-browser-launcher" ).detect( available => {
		available = available.map( info => info.name );
		available.sort();
		const names = new Set( available );
		if ( !names.has( config.browser ) ) {
			const listOr = require( "./listOr" );
			available = [];
			names.forEach( name => available.push( `"${name}"` ) );
			console.error( `browser "${config.browser}" is not a valid browser name (not ${listOr( available )})` )
			process.exit( 2 );
		}
		resolve( config );
	} );
} );
