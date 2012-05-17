var fs = require("fs"),
	r_split = /<\?|\?>/g,
	r_equal = /^=/,
	r_line = /.*(\n|$)/g;

function jhp2js( content ) {
	var code = "module.exports = function( request, response ) {",
		toWrite = [],
		tmp;
	function flush() {
		if ( toWrite.length ) {
			code += "response.write(" + toWrite.join("+") + ");";
		}
		toWrite = [];
	}
	content.split( r_split ).forEach(function( fragment, index ) {
		if ( index % 2 ) {
			if ( r_equal.test( fragment ) ) {
				toWrite.push( "(" + fragment.substr( 1 ) + ")" );
			} else {
				flush();
				code += fragment;
			}
		} else {
			r_line.lastIndex = 0;
			while(( tmp = r_line.exec( fragment ) ) && tmp[ 0 ] ) {
				toWrite.push( JSON.stringify( tmp[ 0 ] ) + tmp[ 1 ] );
			}
		}
	});
	flush();
	return code + "};";
};

function stripBOM( content ) {
	// Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
	// because the buffer-to-string conversion in `fs.readFileSync()`
	// translates it to FEFF, the UTF-16 BOM.
	if (content.charCodeAt( 0 ) === 0xFEFF) {
		content = content.slice( 1 );
	}
	return content;
}

require.extensions[ ".jhp" ] = function( module, filename ) {
	try {
		module._compile( jhp2js( stripBOM( require("fs").readFileSync( filename, "utf8" ) ) ), filename );
	} catch( e ) {
		module.exports = function( _, response ) {
			response.writeHead( 500, {
				"Content-Type": "text/plain"
			});
			response.end( e.stack );
		};
	}
	var watcher = fs.watch( filename, function() {
		watcher.close();
		delete require.cache[ filename ];
	});
};
