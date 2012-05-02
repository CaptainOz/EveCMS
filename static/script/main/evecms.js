
/// @namespace
var EveCMS = {};

/// Core application class.
/// @class
EveCMS.Application = (function(){
    "use strict";
    var _instance = null;

    function Application(){
        // TODO: Bring over inheritance utilities from RiydaJS.
        Application._init.call( this );
    }
    Application._init = function(){
        _instance = this;
        var socket = this._socket = io.connect();
        socket.on( 'connect', _onSocketConnect.bind( this ) );
        socket.on( 'module-response', _onModuleResponse.bind( this ) );
    };
    var ApplicationProto = Application.prototype;

    Application.getInstance = function(){
        return _instance;
    };

    function _getPathData(){
        var path = location.pathname.split( '/' );
        path.shift();
        return path;
    }

    /// Handles new connections starting.
    ///
    /// @this {Application}
    function _onSocketConnect(){
        console.log( 'Connected' );
        this._socket.emit( 'response', { hello : 'server' } );
        _start.call( this );
    }

    /// Handles loads of new modules.
    function _onModuleResponse( data ){
        // If this is not for the current module, ignore it.
        if( _getPathData()[0] != data.module ){
            return;
        }

        $('#body').html( data.html );
    }

    /// Reads the initial URL and opens the first module.
    function _start(){
        // Read URL and request page.
        var path    = _getPathData();
        var module  = path[0];
        this._socket.emit( 'module-request', { module : module } );
    }

    return Application;
}());

$(function(){
    var app = new EveCMS.Application();
});
