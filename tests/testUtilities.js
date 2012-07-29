
module.exports = {
    /// Creates a stub test function which always passes.
    ///
    /// The name of the function we are stubbing will be printed to the command line with "not
    /// implemented!" making it clear that the test is missing.
    ///
    /// @param {string} testName The name of the test we are stubbing.
    ///
    /// @return {function} A NodeUnit test function.
    stub : function( testName ){
        return function( t ){
            console.log( "\t*** %s not implemented! ***", testName );
            t.done();
        };
    }
};
