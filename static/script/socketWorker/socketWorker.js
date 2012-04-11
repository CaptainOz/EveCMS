
var SocketWorker = (function(){
    importScripts( '/scripts/common' );
    importScripts( '/socket.io/socket.io.js' );
    var worker = self;

    function SocketWorker(){
        var socket      = io.connect();
        this._socket    = socket;
        socket.on( 'connect', function(){
        });
        worker.addEventListener( 'message', _onWorkerMessage.bind( this ) );
    }

    function _onWorkerMessage( message ){
        this._socket.emit( 'response', message.data );
    }

    return SocketWorker;
})();

var socketWorker = new SocketWorker();
