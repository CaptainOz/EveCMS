
var _instance = null;
var fs = require( 'fs' );
var paths = require( './paths.js' );

/// @class
/// @constructor
///
/// @param {*} app The Express application object.
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
    socket.on( 'module-request', function( data ){
        _loadModule.call( this, socket, data.module );
    });
}

function _loadModule( socket, module ){
    fs.readFile( paths.DIR_LAYOUTS + module + '.html', 'utf-8', function( error, data ){
        if( error ){
            console.log( error );
            return;
        }
        socket.emit( 'module-response', { module : module, html : data } );
    });
}

exports.init = function( app ){
    _instance = new EveCMS( app );
};

exports.getInstance = function(){
    return _instance;
};
