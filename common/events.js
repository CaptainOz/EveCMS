
var events = (function(){
    return {
        'EventEmitter' : (function(){
            function EventEmitter(){
                this._listeners = {};
            }
            var EventEmitterProto = EventEmitter.prototype;

            function _getListenerSet( event ){
                if( !this._listeners[event] ){
                    this._listeners[event] = [];
                }
                return this._listeners[event];
            }
            
            function _addListener( event, handler, once ){
                var listenerSet = _getListenerSet.call( this, event );
                listenerSet.push({
                    'once' : once,
                    'func' : handler
                });
            }

            EventEmitterProto.on = function( event, handler ){
                _addListener.call( this, event, handler, false );
            };

            EventEmitterProto.once = function( event, handler ){
                _addListener.call( this, event, handler, true );
            };

            EventEmitterProto.emit = function( event, args ){
                arguments.shift();
                args = arguments;
                var listenerSet = _getListenerSet.call( this, event );
                if( event == 'error' && listenerSet.length === 0 ){
                    var error = new Error( 'Error emitted without listener.' );
                    error.data = args;
                    throw error;
                }
                for( var i in listenerSet ){
                    listenerSet[i].func.apply( null, args );
                    if( listenerSet[i].once ){
                        listenerSet.splice( i, 1 );
                    }
                }
            };

            return EventEmitter;
        })()
    };
})();

// Only set up module exports if we are on the server. These symbols aren't defined on the client.
if( typeof module   == 'object'     &&
    typeof exports  == 'object'     &&
    typeof require  == 'function'
){
    module.exports = events;
}
