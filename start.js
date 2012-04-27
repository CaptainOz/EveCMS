
// --- IMPORTS --- //

var express = require( 'express'            );
var app     = express.createServer();
var evecms  = require( './lib/evecms.js'    );
var util    = require( './lib/util.js'      );

// --- CONSTANTS --- //

var DIR_ROOT    = __dirname + '/';
var DIR_COMMON  = DIR_ROOT + 'common/';
var DIR_SCRIPTS = DIR_ROOT + 'static/script/';
var DIR_STYLE   = DIR_ROOT + 'static/style/';

var ROUTE_SCRIPTS   = /\/scripts\/(?!common)(.+)/;
var ROUTE_COMMON    = '/scripts/common';
var ROUTE_STYLE     = '/style/:module';

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
    app.get( ROUTE_STYLE, function( req, res ){
        if( req.params.group == 'user' ){
            evecms.getInstance().sendUserStyles( res );
        }
        else {
            util.sendDirectoryContents( DIR_STYLE + req.params.module, /\.css$/, res )
                .once( 'file', function(){
                    res.writeHead( 200, { 'Content-Type' : 'text/css' } );
                }).once( 'error', function( err ){
                    console.log( err );
                    res.writeHead( 404 );
                    res.end();
                });
        }
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
    var cssExt = '.min.css.gz';
    app.get( ROUTE_SCRIPTS, function( req, res ){
        res.sendfile( DIR_SCRIPTS + req.params[0] + jsExt );
    });
    app.get( ROUTE_COMMON, function( req, res ){
        res.sendfile( DIR_COMMON + 'common' + jsExt );
    });
    app.get( ROUTE_STYLE, function( req, res ){
        if( req.params.module == 'user' ){
            evecms.getInstance().sendUserStyles( res );
        }
        else {
            res.sendfile( DIR_STYLE + res.params.module + cssExt );
        }
    });
});

// --- ROUTING --- //

// Everything that isn't JS, CSS, or images gets the index page. Follow up requests through
// socket.io will handle the specific needs of the page.
app.get( /\/(?!scripts|style|img).*/, function( req, res ){
    res.sendfile( __dirname + '/static/index.html' );
});

// --- EVECMS --- //

evecms.init( app );
