
// --- IMPORTS --- //

var express = require( 'express'            );
var expose  = require( 'express-expose'     );
var app     = express.createServer();
var io      = require( 'socket.io'          ).listen( app );
var evecms  = require( './lib/evecms.js'    );
var util    = require( './lib/util.js'      );

// --- CONSTANTS --- //

var DIR_ROOT    = __dirname + '/';
var DIR_COMMON  = DIR_ROOT + 'common/';
var DIR_SCRIPTS = DIR_ROOT + 'static/script/';

var ROUTE_SCRIPTS   = /\/scripts\/(?!common)(.+)/;
var ROUTE_COMMON    = '/scripts/common';

// --- FUNCTIONS --- //

function _sendJSFiles( dirPath, out ){
    util.sendDirectoryContents( dirPath, /\.js$/, out )
        .once( 'file', function(){
            out.writeHead( 200, { 'Content-Type' : 'application/javascript' } );
        }).on( 'file', function( dirPath, filename ){
            out.write(
                '\n\n'                                                                  +
                '// ------------------------------------------------------------ //\n'  +
                '// ' + dirPath + '/' + filename + '\n'                                 +
                '// ------------------------------------------------------------ //\n\n'
            );
        }).once( 'error', function( err ){
            console.log( err );
            out.writeHead( 404 );
            out.end();
        });
}

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
    app.get( ROUTE_SCRIPTS, function( req, res ){
        _sendJSFiles( DIR_SCRIPTS + req.params[0], res );
    });
    app.get( ROUTE_COMMON, function( req, res ){
        _sendJSFiles( DIR_COMMON, res );
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
    var jsExt = '.min.js.gz';
    app.get( ROUTE_SCRIPTS, function( req, res ){
        res.sendfile( DIR_SCRIPTS + req.params.module + jsExt );
    });
    app.get( ROUTE_COMMON, function( req, res ){
        res.sendfile( DIR_COMMON + 'common' + jsExt );
    });
});

// --- ROUTING --- //

app.get( '/', function( req, res ){
    res.sendfile( __dirname + '/static/index.html' );
});

// --- SOCKET.IO --- //

io.sockets.on( 'connection', function( socket ){
    socket.emit();
    socket.on( 'response', function( data ){
        console.log( data );
    });
});

// --- EVECMS --- //

evecms.init( app );
