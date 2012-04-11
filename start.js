
// --- IMPORTS --- //

var express = require( 'express'            );
var app     = express.createServer();
var io      = require( 'socket.io'          ).listen( app );
var evecms  = require( './lib/evecms.js'    );
var util    = require( './lib/util.js'      );

// --- CONSTANTS --- //

var DIR_SCRIPTS = __dirname + '/static/script/';

// --- UNIVERSAL CONFIGURATION --- //

app.configure(function(){
    app.use( express.bodyParser() );
    app.use( express['static']( __dirname + '/static' ) );
});

// --- DEV CONFIGURATION --- //

app.configure( 'development', function(){
    app.use( express.errorHandler({
            'dumpExceptions'    : true,
            'showStack'         : true
        })
    );

    // In dev mode we send all the files concatenated together.
    app.get( '/scripts/:module', function( req, res ){
        util.sendDirectoryContents( DIR_SCRIPTS + req.params.module, /\.js$/, res )
            .once( 'file', function(){
                res.writeHead( 200, { 'Content-Type' : 'application/javascript' } );
            }).on( 'file', function( dirPath, filename ){
                res.write(
                    '\n\n'                                                                  +
                    '// ------------------------------------------------------------ //\n'  +
                    '// ' + dirPath + '/' + filename + '\n'                                 +
                    '// ------------------------------------------------------------ //\n\n'
                );
            }).once( 'error', function( err ){
                console.log( err );
                res.writeHead( 404 );
                res.end();
            });
    });

});

// --- PRODUCTION CONFIGURATION --- //

app.configure( 'production', function(){
    app.use( express.errorHandler({
            'dumpExceptions'    : false,
            'showStack'         : false
        })
    );

    // In production we send the minified, zipped version of the modules.
    app.get( '/scripts/:module', function( req, res ){
        res.sendfile( DIR_SCRIPTS + req.params.module + '.min.js.gz' );
    });
});

// --- ROUTING --- //

app.get( '/', function( req, res ){
    res.sendfile( __dirname + '/static/index.html' );
});

// --- SOCKET.IO --- //

io.sockets.on( 'connection', function( socket ){
    socket.emit( 'news', { 'hello' : 'world' } );
    socket.on( 'response', function( data ){
        console.log( data );
    });
});

// --- EVECMS --- //

evecms.init( app );
