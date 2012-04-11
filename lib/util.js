
var fs      = require( 'fs'     );
var events  = require( 'events' );

function _sendFilesAsync( dirPath, files, outStream, statusEmitter ){
    var filename = files.shift();
    var inStream = fs.createReadStream( dirPath + '/' + filename, { encoding : 'utf8' } );
    statusEmitter.emit( 'file', dirPath, filename );
    inStream.pipe( outStream, { 'end' : false } );
    inStream.on( 'end', function(){
        if( files.length ){
            _sendFilesAsync( dirPath, files, outStream );
        }
        else {
            statusEmitter.emit( 'end' );
            outStream.end();
        }
    });
}

module.exports = {
    /// Sends the contents of the directory appended back-to-front.
    ///
    /// The status emitter emits the following events:
    ///  - `error` When an error occurs while sending.
    ///  - `file`  Before each file is sent.
    ///  - `end`   When the last file has finished being sent.
    ///
    /// @param {string}         dirPath     The directory to send the contents of.
    /// @param {RegExp}         fileCheck   The pattern test files names against.
    /// @param {WritableStream} outStream   The stream to send the file contents over.
    ///
    /// @return {events.EventEmitter} A status emitter.
    'sendDirectoryContents' : function( dirPath, fileCheck, outStream ){
        fileCheck = fileCheck || /.*[^\.].*/;
        var statusEmitter = new events.EventEmitter();
        fs.readdir( dirPath, function( err, files ){
            if( err ){
                statusEmitter.emit( 'error', err );
            }
            else {
                // Filter out any files that don't match the provided regex.
                var filesToSend = [];
                for( var i in files ){
                    if( fileCheck.test( files[i] ) ){
                        filesToSend.push( files[i] );
                    }
                }
                
                if( filesToSend.length === 0 ){
                    statusEmitter.emit( 'error', new Error( 'No files match.' ) );
                }
                else {
                    // And send the files.
                    _sendFilesAsync( dirPath, filesToSend, outStream, statusEmitter );
                }
            }
        });
        return statusEmitter;
    }
};
