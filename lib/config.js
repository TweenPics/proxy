"use strict";

require( `wires` );

const packageInfo = require( `../package` );
const program = require( `commander` );
const readFile = require( `fs` ).readFileSync;

const outputDefault = value => ( value ? `\n                       (${ value })` : `` );

const config = {
    "authent": require( `#authent` ),
    "browser": require( `#browser` ),
    "credentials": {
        "cert": readFile( `${ __dirname }/../data/tweenpics.cert` ),
        "key": readFile( `${ __dirname }/../data/tweenpics.key` ),
    },
    "origin": require( `#origin` ),
    "start": require( `#start` ),
};

program
    .version( packageInfo.version )
    .description( packageInfo.description )
    .option( `-a, --authent [token]`, `specify authentication token${ outputDefault( config.authent ) }` )
    .option( `-b, --browser [name]`, `specify the browser to open (${ config.browser })` )
    .option( `-s, --start [url]`, `specify start page${ outputDefault( config.start ) }` )
    .parse( process.argv );

if ( program.args.length ) {
    console.error( `unexpected arguments` );
    program.outputHelp();
    process.exit( 1 );
}

[ `authent`, `browser`, `start` ].forEach( key => ( config[ key ] = program[ key ] || config[ key ] ) );

if ( !config.authent ) {
    console.error( `authentification token required` );
    program.outputHelp();
    process.exit( 1 );
}

if ( !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}$/.test( config.authent ) ) {
    console.error( `authentification token "${ config.authent }" is invalid` );
    process.exit( 2 );
}

if ( !config.browser ) {
    console.error( `browser is required` );
    process.exit( 1 );
}

const launchers = require( `./launchers` );

if ( !launchers.exists( config.browser ) ) {
    console.error(
        `browser "${ config.browser }" is not a valid browser name.\n\nvalid browser names are:\n${
            launchers
                .getExisting()
                .map( name => `- ${ name }` )
                .join( `\n` )
        }`
    );
    process.exit( 2 );
}

module.exports = config;
