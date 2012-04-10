
var express = require( 'express'            )
var app     = express.createServer();
var io      = require( 'socket.io'          ).listen( app );
var evecms  = require( './lib/evecms.js'    );

app.configure(function(){
    app.use( express.bodyParser() );
    app.use( express['static']( __dirname + '/static' ) );
});

app.configure( 'development', function(){
    app.use( express.errorHandler({
            'dumpExceptions'    : true,
            'showStack'         : true
        })
    );
});

app.configure( 'production', function(){
    app.use( express.errorHandler({
            'dumpExceptions'    : false,
            'showStack'         : false
        })
    );
});

app.get( '/', function( req, res ){
    res.sendfile( __dirname + '/static/index.html' );
});

io.sockets.on( 'connection', function( socket ){
    socket.emit( 'news', { 'hello' : 'world' } );
    socket.on( 'response', function( data ){
        console.log( data );
    });
});

app.listen( 80 );
