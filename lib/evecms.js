
var _instance = null;

/// @class
/// @constructor
///
/// @param 
function EveCMS( app ){
    this._io = require( 'socket.io' ).listen( app );
    this._app = app;

    // Set up the IO socket connections.
    this._io.sockets.on( 'connection', _onSocketConnect.bind( this ) );

    // Start the app.
    app.listen( 80 );
}

/// @this {EveCMS}
function _onSocketConnect( socket ){
    socket.emit();
    socket.on( 'response', function( data ){
        console.log( data );
    });
}

exports.init = function( app ){
    _instance = new EveCMS( app );
};

exports.getInstance = function(){
    return _instance;
};
