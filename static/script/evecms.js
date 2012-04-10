
var EveCMS = {};
EveCMS.Application = (function(){
    var _instance = null;
    
    function Application(){
        // TODO: Bring over inheritance utilities from RiydaJS.
        Application._init.call( this );
    };
    Application._init = function(){
        _instance = this;

        var socketWorker = new Worker( '/script/socketWorker/socketWorker.js' );
        socketWorker.addEventListener( 'message', _onSocketWorkerMessage.bind( this ) );
        socketWorker.postMessage();
        this._socketWorker = socketWorker;
    };
    var ApplicationProto = Application.prototype;

    Application.getInstance = function(){
        return _instance;
    };

    function _onSocketWorkerMessage( message ){
        console.log( message.data );
        this._socketWorker.postMessage( { my : 'response from other thread' } );
    }

    return Application;
})();

$(function(){
    new EveCMS.Application();
});
