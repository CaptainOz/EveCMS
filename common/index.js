
// Only set up module exports if we are on the server. These symbols aren't defined on the client.
if( typeof module   == 'object'     &&
    typeof exports  == 'object'     &&
    typeof require  == 'function'
){
    module.exports = {
        'events'    : require( './events.js'    ),
        'util'      : require( './utilities.js' )
    };
}
