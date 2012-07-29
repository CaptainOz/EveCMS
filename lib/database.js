///
/// @file lib/database.js
///
/// This is a thin wrapper around the mysql package. It provides a centralized connection which any
/// other module can use by simply including this one.
///
/// @author Oz <oz@lifewanted.com>
///

// --- INCLUDES --- //
var mysql   = require( 'mysql'  );
var util    = require( 'util'   );
var events  = require( 'events' );

// --- Database Class --- //

/// @class Database
///
/// The Database class provides a simplified interface to mysql that can be shared between disparate
/// modules.
///
/// @par Events Emitted
/// @li connected       Upon successful connection to the remote database.
/// @li disconnected    Upon successful disconnection from the remote database.
/// @li error           If an error occurs and no callback function is provided to handle it.
var Database = (function(){
    /// Database constructor.
    /// @ctor
    function Database(){
        events.EventEmitter.call( this );
        this.connection = null;
    }
    
    util.inherits( Database, events.EventEmitter );
    var DatabaseProto = Database.prototype;
    
    /// Triggers an error event on the database.
    ///
    /// @this Database
    ///
    /// @param {Object}     err         The error to trigger.
    /// @param {Function}   callback    A function to call instead of triggering an error event.
    function _error( err, callback ){
        if( callback ){
            callback( err );
        }
        else {
            this.emit( 'error', err );
        }
    }
    
    /// Transmits an error from the driver through the database object for the application to
    /// handle.
    ///
    /// @todo Translate driver errors to our own errors.
    ///
    /// @param {Object} err The driver error.
    function _handleDriverError( err ){
        this.emit( 'error', err );
    }
    
    /// Creates a new database connection.
    ///
    /// This method should only be called once. Subsequent calls after a successful connection
    /// without first diconnecting will result in an error.
    ///
    /// @param {Object}     params      Connection options to be passed to the mysql module.
    /// @param {Function}   callback    Function to call once the connection has been established.
    ///
    /// @return This object.
    ///
    /// @par Events Emitted
    /// @li connected   Upon successful connection to the database.
    /// @li error       If an error occurs while trying to connnect and no callback is provided.
    DatabaseProto.connect = function( params, callback ){
        if( this.connection ){
            _error.call(
                this,
                new Error( 'Already connected to database, disconnect first.' ),
                callback
            );
            return;
        }
    
        this.connection = mysql.createConnection( params );
        this.connection.on( 'error', _handleDriverError.bind( this ) );
        this.connection.connect( _connectHandler.bind( this, callback ) );
        return this;
    };
    
    function _connectHandler( callback, err ){
        if( err ){
            this.connection = null;
            _error.call( this, err, callback );
            return;
        }
    
        if( callback ){
            callback();
        }
        this.emit( 'connected' );
    }
    
    /// Disonnects from the remote database.
    ///
    /// @param {Function} callback A function to call after attempting to disconnect.
    ///
    /// @par Events Emitted
    /// @li disconnected    Upon successful disconnection from the remote database.
    /// @li error           If an error occurs and no callback function is provided to handle it.
    DatabaseProto.disconnect = function( callback ){
        if( this.connection ){
            this.connection.end( _disconnectHandler.bind( this, callback ) );
        }
        else {
            callback();
        }
    };
    
    function _disconnectHandler( callback, err ){
        if( err ){
            _error.call( this, err, callback );
            return;
        }
    
        this.connection = null;
        if( callback ){
            callback();
        }
        this.emit( 'disconnected' );
    }

    /// Executes the given SQL query with the provided data.
    ///
    /// If the `data` parameter is an array of arrays then the query is executed once for each array
    /// in `data`. Otherwise the query is just executed once.
    ///
    /// @param {String} sql     The SQL query to execute.
    /// @param {Array}  data    The data to pass with the query.
    ///
    /// @return {Query} A Query object which will give you access to the results.
    DatabaseProto.query = function( sql, data ){
        if( data && util.isArray( data[0] ) ){
            return new MultiQuery( this.connection, sql, data );
        }
        else {
            return new Query( this.connection.query( sql, data ) );
        }
    };

    return Database;
})();

// --- Query Class --- //

/// @class Query
///
/// The Query class wraps the driver's own query result class. It provides a way to access the data
/// either streaming or as a chunk at the end. It also (mostly) meets the Readable Stream interface
/// requirements.
///
/// @par Events Emitted
/// @li error   Upon an error with the query.
/// @li fields  Before the first data event.
/// @li data    For each row in the result set for selects and after the query for all others.
/// @li end     After the query is finished. The results will be passed through this event if the
///             data event is unhandled.
var Query = (function(){
    /// Query consutrctor.
    /// @ctor
    ///
    /// @param {mysql.Query} query The query object to wrap.
    function Query( query ){
        events.EventEmitter.call( this );

        this._query     = query;
        this._data      = [];
        this.readable   = true;
        query
            .on( 'error',   _handleQueryError.bind( this ) )
            .on( 'fields',  _handleFields.bind( this ) )
            .on( 'result',  _handleRow.bind( this ) )
            .on( 'end',     _handleEnd.bind( this ) );
    }

    util.inherits( Query, events.EventEmitter );
    var QueryProto = Query.prototype;

    /// Re-casts a driver error on our class.
    ///
    /// @todo Convert driver errors to our own errors.
    ///
    /// @param {Object} err The error to recast.
    function _handleQueryError( err ){
        this.readable = false;
        this.emit( 'error', err );
    }

    function _handleFields( fields ){
        this.emit( 'fields', fields );
        this._fields = fields;
    }

    function _handleRow( row ){
        if( this.listeners( 'data' ).length ){
            this.emit( 'data', row );
        }
        else {
            this._data.push( row );
        }
    }

    function _handleEnd(){
        this.readable = false;
        this.emit( 'end', this._data.length ? { fields : this._fields, data : this._data } : null );
    }

    QueryProto.pause = function(){
        this._query.pause();
    };

    QueryProto.resume = function(){
        this._query.resume();
    };

    QueryProto.pipe = function( dest, options ){
        this.on( 'data',    _handlePipeData.bind(   this, dest, options ) );
        this.on( 'end',     _handlePipeEnd.bind(    this, dest, options ) );
        dest.on( 'drain',   _handlePipeDrain.bind(  this, dest, options ) );
        dest.emit( 'pipe', this );
    };

    function _handlePipeData( dest, options, data ){
        if( !dest.write( data ) ){
            this.pause();
        }
    }

    function _handlePipeEnd( dest, options ){
        if( options.end !== false ){
            dest.end();
        }
    }

    function _handlePipeDrain( dest, options ){
        this.resume();
    }

    return Query;
})();

var MultiQuery = (function(){
    function MultiQuery( connection, sql, data ){
        events.EventEmitter.call( this );

        this._queries       = [];
        this._data          = [];
        this._fields        = [];
        this.readable       = true;
        this._unhandledData = false;
        for( var i = 0; i < data.length; ++i ){
            var query = new Query( connection.query( sql, data[ i ] ) );
            query._multiQueryIndex = i;
            this._queries.push( query );
            this._data.push( [] );
            this._fields.push( null );
            
            query.on( 'fields', _handleFields.bind( this, i ) );
            query.on( 'data',   _handleData.bind( this, i ) );
            query.on( 'error',  _handleError.bind( this, i ) );
            query.on( 'end',    _handleEnd.bind( this, i ) );
        }
        this._query = this._queries[0];
    }
    
    util.inherits( MultiQuery, Query );
    var MultiQueryProto = MultiQuery.prototype;

    function _handleFields( index, fields ){
        this._fields[ index ] = fields;
    }

    function _handleData( index, data ){
        if( this.listeners( 'data' ).length ){
            this.emit( 'data', data, index );
        }
        else {
            this._data[ index ].push( data );
            this._unhandledData = true;
        }
    }

    function _handleError( index, err ){
        this.emit( 'error', err, index );
    }

    function _handleEnd( index ){
        // If we are at the last query, emit the final end event.
        if( this._queries.length == index + 1 ){
            this.emit(
                'end',
                this._unhandledData ? { fields : this._fields, data : this._data } : null
            );
        }

        // Otherwise rotate the active query.
        else {
            this._query = this._queries[ index + 1 ];
        }
    }

    return MultiQuery;
})();

module.exports = new Database();
module.exports.Database = Database;
module.exports.Query    = Query;
