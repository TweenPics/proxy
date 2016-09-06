"use strict";

module.exports = ( array, joiner = "or" ) => array.reduceRight(
	( output, current, index ) => ( index ? ( output ? ", " : ` ${joiner} ` ) : "" ) + current + output,
	""
);
