
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
                for( var i in listenerSet ){
                    listenerSet[i].func.apply( null, args );
                    if( listenerSet[i].once ){
                        listenerSet.splice( i, 1 );
                    }
                }
            };

        })()
    };
})();

var module = module || {};
module.exports = events;
