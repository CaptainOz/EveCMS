// Only import if we are on the server.
var util = util || {};
if( typeof module   == 'object'     &&
    typeof exports  == 'object'     &&
    typeof require  == 'function'
){
    util = require( './001.utilities.js' );
}

var Thread = (function(){
    function _Thread(){}

    // If Worker exists we'll have a real thread.
    if( Worker && typeof Worker == "function" ){
        (function(){
            if( importScripts ){
                importScripts( '/scripts/common' );
            }

            _Thread._init = function( scriptName ){
                if( !importScripts ){
                    this._worker = new Worker( scriptName );
                    this._worker.postMessage();
                }
                else {
                    this._worker = self;
                }

                this._worker.addEventListener( 'message', _onMessage.bind( this ) );
            };
            var ThreadProto = _Thread.prototype;

            _Thread.getThread = function( scriptName ){
                return new Thread( scriptName );
            };

            function _onMessage( message ){
                events.EventEmitter.prototype.emit.apply( this, message.data );
            }

            function _sendMessage( data ){
                this._worker.postMessage( data );
            }

            ThreadProto.emit = function( event, args ){
                _sendMessage.call( this, arguments );
            };
        })();
    }

    // ---------------------------------------------------- //

    // Otherwise we'll use an asynchronous event emitter.
    else {
        (function(){
            var _threads = {};
        
            _Thread._init = function( scriptName ){
                // TODO: Load script here.
            };
            var ThreadProto = _Thread.prototype;

            _Thread.getThread = function( scriptName ){
                if( !_threads[scriptName] ){
                    _threads[scriptName] = new Thread( scriptName );
                }
                return _threads[scriptName];
            };

            ThreadProto.emit = function( event, args ){
                var self = this;
                setTimeout( function(){
                    events.EventEmitter.prototype.emit.apply( self, arguments );
                }, 0 );
            };
        })();
    }

    return util.inherit( events.EventEmitter, _Thread );
})();
