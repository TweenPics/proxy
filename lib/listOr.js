"use strict";

module.exports = ( array, joiner = `or` ) => array.reduceRight(
    // eslint-disable-next-line no-nested-ternary
    ( output, current, index ) => ( index ? ( output ? `, ` : ` ${ joiner } ` ) : `` ) + current + output,
    ``
);
