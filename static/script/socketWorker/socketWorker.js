
var SocketWorker = (function(){
    importScripts( '/socket.io/socket.io.js' );
    var worker = self;

    function SocketWorker(){
        var socket      = io.connect();
        this._socket    = socket;
        socket.on( 'news', function( data ){
            worker.postMessage( data );
        });
        worker.addEventListener( 'message', _onWorkerMessage.bind( this ) );
    }

    function _onWorkerMessage( message ){
        this._socket.emit( 'response', message.data );
    }

    return SocketWorker;
})();

var socketWorker = new SocketWorker();
