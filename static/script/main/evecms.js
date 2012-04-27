
/// @namespace
var EveCMS = {};

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
    };
    var ApplicationProto = Application.prototype;

    Application.getInstance = function(){
        return _instance;
    };

    /// @this {Application}
    function _onSocketConnect(){
        console.log( 'Connected' );
        this._socket.emit( 'response', { hello : 'server' } );
    }

    return Application;
})();

$(function(){
    new EveCMS.Application();
});
