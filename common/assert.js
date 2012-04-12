
// Only import if we are on the server.
var util = util || {};
if( typeof module   == 'object'     &&
    typeof exports  == 'object'     &&
    typeof require  == 'function'
){
    util = require( './utilities.js' );
}


/// Asserts that the given value is true.
///
/// @throws {Error} If `val` is not true.
///
/// @param {boolean}    val     The value to assert for truth.
/// @param {string?}    message An optional message to put in the error.
function assert( val, message ){
    if( !val ){
        var error = 'Assertion failure' + (message ? ': ' + message : '') + '.';
        throw new Error( error );
    }
}

/// Asserts that `constr` is a constructor for the class `clas` or any subclass of `clas`.
///
/// @throws {Error} If `constr` is not a constructor for `clas`.
///
/// @param {*}          constr  The constructor to test.
/// @param {function}   clas    The class to check for.
function assertBuilds( constr, clas ){
    assert(
        constr.prototype instanceof clas,
        constr + ' is not a constructor for ' + util.getFunctionName( clas )
    );
}

/// Asserts that `obj` is an instance of the class `clas`.
///
/// @throws {Error} If `obj` is not an instance of `clas`.
///
/// @param {*}          obj     The object to test.
/// @param {function}   clas    The class to test for.
function assertInstance( obj, clas ){
    assert(
        obj instanceof clas,
        obj + ' is not an instance of ' + util.getFunctionName( clas )
    );
}

/// Asserts that `arr` is an array.
///
/// @throws {Error} If `arr` is not an array.
///
/// @param {*} arr The object to test.
function assertIsArray( arr ){
    assert( util.isArray( arr ), arr + ' is not an array' );
}

/// Asserts that `func` is a function.
///
/// @throws {Error} If `func` is not a function.
///
/// @param {*} func The object to test.
function assertIsFunction( func ){
    assert( util.isFunction( func ), func + ' is not a function' );
}

/// Asserts that `str` is a string.
///
/// @throws {Error} If `str` is not a string.
///
/// @param {*} str The object to test.
function assertIsString( str ){
    assert( util.isString( str ), str + ' is not a string' );
}

// Only set up module exports if we are on the server. These symbols aren't defined on the client.
if( typeof module   == 'object'     &&
    typeof exports  == 'object'     &&
    typeof require  == 'function'
){
    module.exports      = assert;
    assert.builds       = assertBuilds;
    assert.instance     = assertInstance;
    assert.isArray      = assertIsArray;
    assert.isFunction   = assertIsFunction;
    assert.isString     = assertIsString;
    
    exports._export = function( out ){
        out.assertBuilds        = assert.builds;
        out.assertInstance      = assert.instance;
        out.assertIsArray       = assert.isArray;
        out.assertIsFunction    = assert.isFunction;
        out.assertIsString      = assert.isString;
    };
}

