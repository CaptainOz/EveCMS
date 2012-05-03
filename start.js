
// --- IMPORTS --- //

var express = require( 'express'            );
var evecms  = require( './lib/evecms.js'    );
var util    = require( './lib/util.js'      );
var paths   = require( './lib/paths.js'     );
var stylus  = require( 'stylus'             );

// --- CONSTANTS --- //

var ROUTE_SCRIPTS   = /\/scripts\/(?!common)(.+)/;
var ROUTE_COMMON    = '/scripts/common';
var ROUTE_STYLES    = '/style/:module';
var ROUTE_IMAGES    = /\/img\/(.+)/;

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

var app = express.createServer();

app.configure(function(){
    app.use( express.bodyParser() );
});

// --- DEV CONFIGURATION --- //

app.configure( 'development', function(){
    app.use( express.errorHandler({
            'dumpExceptions'    : true,
            'showStack'         : true
        })
    );
    app.use( stylus.middleware({
            'src'       : paths.DIR_STYLUS,
            'dest'      : paths.DIR_STYLE
        })
    );
    app.use( express['static']( paths.DIR_STYLE ) );

    // In dev mode we send all the files concatenated together.
    app.get( ROUTE_SCRIPTS, function( req, res ){
        console.log( "Retrieving scripts " + req.params[0] );
        _sendJSFiles( paths.DIR_SCRIPTS + req.params[0], res );
    });
    app.get( ROUTE_COMMON, function( req, res ){
        console.log( "Retrieving common scripts" );
        _sendJSFiles( paths.DIR_COMMON, res );
    });
});

// --- PRODUCTION CONFIGURATION --- //

app.configure( 'production', function(){
    app.use( express.errorHandler({
            'dumpExceptions'    : false,
            'showStack'         : false
        })
    );
    app.use( stylus.middleware({
            'src'       : paths.DIR_STYLUS,
            'dest'      : paths.DIR_STYLE,
            'compress'  : true
        })
    );
    app.use( express['static']( paths.DIR_STYLE ) );


    // In production we send the minified, zipped version of the modules.
    var jsExt = '.min.js.gz';
    var cssExt = '.min.css.gz';
    app.get( ROUTE_SCRIPTS, function( req, res ){
        res.sendfile( paths.DIR_SCRIPTS + req.params[0] + jsExt );
    });
    app.get( ROUTE_COMMON, function( req, res ){
        res.sendfile( paths.DIR_COMMON + 'common' + jsExt );
    });
    app.get( ROUTE_STYLES, function( req, res ){
        if( req.params.module == 'user' ){
            evecms.getInstance().sendUserStyles( res );
        }
        else {
            res.sendfile( paths.DIR_STYLE + res.params.module + cssExt );
        }
    });
});

// --- ROUTING --- //

app.get( ROUTE_IMAGES, function( req, res ){
    console.log( "Retrieving image: " + req.params[0] );
    res.sendfile( paths.DIR_IMAGES + req.params[0] );
});

// Everything that isn't JS, CSS, or images gets the index page. Follow up requests through
// socket.io will handle the specific needs of the page.
app.get( /^\/(?!img|scripts|style|favicon)/, function( req, res ){
    console.log( "Retrieving index: " + req.path );
    res.sendfile( __dirname + '/static/index.html' );
});

// --- EVECMS --- //

evecms.init( app );
