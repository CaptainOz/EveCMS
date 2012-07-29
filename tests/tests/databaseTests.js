
// --- INCLUDES --- //

var database    = require( '../../lib/database.js' );
var testUtil    = require( '../testUtilities.js' );
var util        = require( 'util' );
var fs          = require( 'fs' );

// --- GLOBALS --- //

var config  = JSON.parse( fs.readFileSync( 'evecms.json', 'utf8' ) );
var db      = null;

// --- TESTS --- //

module.exports = {
    'Database Connection' : {
        'Errors' : {
            'setUp' : function( done ){
                db = new database.Database();
                done();
            },
            'tearDown' : function( done ){
                if( db ){
                    db.disconnect( done );
                }
                else {
                    done();
                }
            },
            'Bad Host' : function( t ){
                t.expect( 1 );
                var badConfig = {
                    host : config.host,
                    port : config.port + 1,
                    user : config.user,
                    password : config.password
                };
                db.connect( badConfig, function( err ){
                    t.ok( err, 'Should not have succeeded!' ); // TODO Test for specific error.
                    t.done();
                });
            },
            'Bad Username/Password' : function( t ){
                t.expect( 1 );
                var badConfig = {
                    host : config.host,
                    port : config.port,
                    user : 'NotARealUser',
                    password : 'NotARealPassword'
                };
                db.connect( badConfig, function( err ){
                    t.ok( err, 'Should not have succeeded!' ); // TODO Test for specific error.
                    t.done();
                });
            }
        },
        'Correct' : {
            'setUp' : function( done ){
                db = new database.Database();
                done();
            },
            'tearDown' : function( done ){
                if( db ){
                    db.disconnect( done );
                }
                else {
                    done();
                }
            },
            'Connect' : function( t ){
                t.expect( 1 );
                db.connect( config.database, function( err ){
                    t.ok( !err, 'Error on connection: ' + err );
                    t.done();
                });
            },
            'Disconnect' : function( t ){
                t.expect( 2 );
                db.connect( config.database, function( err ){
                    t.ok( !err, 'Error on connection: ' + err );
                    db.disconnect( function( err ){
                        t.ok( !err, 'Error on disconnect: ' + err );
                        db = null;
                        t.done();
                    });
                });
            }
        }
    },
    'Database Query' : {
        'setUp' : function( done ){
            db = new database.Database();
            db.connect( config.database );
            done();
        },
        'tearDown' : function( done ){
            db.disconnect();
            db = null;
            done();
        },
        'Errors' : {
            'Bad SQL Syntax' : function( t ){
                t.expect( 2 );
                var q = db.query( 'SELECT FOR test' );
                q.on( 'error', function( err ){
                    t.ok( true ); // TODO Test for specific error.
                });
                q.on( 'end', function( res ){
                    t.ok( !res, 'Should not have gotten a result.' );
                    t.done();
                });
            }
        },
        'Correct' : {
            'Creates' : function( t ){
                t.expect( 1 );
                var q = db.query( 'CREATE TEMPORARY TABLE testTable ( id INTEGER )' );
                q.on( 'error', function( err ){
                    t.ok( false, 'Error on query: ' + err );
                });
                q.on( 'end', function( res ){
                    t.ok( true );
                    t.done();
                });
            },
            'Inserts' : function( t ){
                db.query( 'CREATE TEMPORARY TABLE testTable ( id INTEGER )' )

                t.expect( 7 );
                var mq = db.query( 'INSERT INTO testTable ( id ) VALUES ( ? )', [ [1], [2], [3] ] );
                mq.on( 'error', function( err ){
                    t.ok( false, 'Error inserting: ' + err );
                });
                mq.on( 'data', function( data, index ){
                    t.ok( data, 'Did not receive data.' );
                    t.equal(
                        data.affectedRows,
                        1,
                        'Incorrect row count affected: ' + data.affectedRows
                    );
                });
                mq.on( 'end', function( data ){
                    t.ok( !data, 'Should not have received data in end event.' );
                    t.done();
                });
            },
            'Selects' : function( t ){
                db.query( 'CREATE TEMPORARY TABLE testTable ( id INTEGER )' )
                db.query( 'INSERT INTO testTable ( id ) VALUES ( ? )', [ [1], [2], [3] ] );

                t.expect( 12 );
                var q = db.query( 'SELECT * FROM testTable ORDER BY id ASC' );
                var i = 1;
                q.on( 'error', function( err ){
                    t.ok( false, 'Error selecting: ' + err );
                });
                q.on( 'fields', function( fields ){
                    t.ok( util.isArray( fields ), 'Missing fields from fields event.' );
                    t.equal( fields.length, 1, 'Incorrect field length: ' + fields.length );

                    var idField = fields[0];
                    var dbName  = config.database.database;
                    t.equal( idField.db,    dbName,         'Incorrect db: '    + idField.db );
                    t.equal( idField.table, 'testTable',    'Incorrect table: ' + idField.table );
                    t.equal( idField.name,  'id',           'Incorrect name: '  + idField.name );
                    // TODO Check field type.c
                });
                q.on( 'data', function( data ){
                    t.ok( data && data.id, 'Missing data from data event.' );
                    t.equal( data.id, i++, 'Incorrect data value: ' + data.id );
                });
                q.on( 'end', function( results ){
                    t.ok( !results, 'Should not have received data in end event.' );
                    t.done();
                });
            }
        }
    }
};
