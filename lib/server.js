require("./compile");

var Deferred = require("JQDeferred"),
	fs = require("fs"),
	http = require("http"),
	mime = require("mime"),
	path = require("path"),
	url = require("url"),

	r_jhp = /\.jhp$/i,
	r_jhpInPath = /(\.jhp)\/(.*)$/i;

function handleRequest( filenames, request, response ) {
	var filename = filenames[ 0 ];
	fs.stat( filename, function( error, stat ) {
		if ( error ) {
			if ( filenames.length > 1 ) {
				handleRequest( filenames.slice( 1 ), request, response );
			} else {
				response.writeHead( 404, {
					"Content-Type": "text/plain"
				});
				response.write( "404 Not Found\n" );
				response.end();
			}
		} else if ( stat.isDirectory() ) {
			handleRequest( [ path.join( filename, "./index.jhp" ), path.join( filename, "./index.html" ) ], request, response );
		} else {
			if ( r_jhp.test( filename ) ) {
				require( filename )( request, response );
			} else {
				// TODO handle cache headers
				response.writeHead( 200, {
					"Content-Type": mime.lookup( filename ),
					"Date": ( new Date() ).toGMTString(),
					"Last-Modified": ( new Date( stat.mtime ) ).toGMTString()
				});
				if ( request.method === "HEAD" ) {
					response.end();
				} else {
					fs.createReadStream( filename ).pipe( response );
				}
			}
		}
	});
}

module.exports = function( dir, port ) {
	dir = path.join( process.cwd(), dir || "." );
	port = ( 1 * port ) || 80;
	process.chdir( dir );
	console.log( "Starting JHP server..." );
	console.log( "* directory: " +  dir );
	console.log( "* port: " + port );
	http.createServer( function( request, response ) {
		request.body = Deferred(function( defer ) {
			var body = "";
			request.on( "data", function( data ) {
				body += data;
			});
			request.on( "end", function() {
				defer.resolve( body );
			});
		}).promise();
		request.parsedURL = url.parse( request.url, true );
		request.query = request.method === "POST"
			? request.body.pipe(function( body ) {
					var urlQuery = request.parsedURL.query,
						query, key;
					try {
						query = require("querystring").parse( body );
						for( key in urlQuery ) {
							if ( !( key in query ) ) {
								query[ key ] = urlQuery[ key ];
							}
						}
					} catch( e ) {
						query = urlQuery;
					}
					return query;
				})
			: Deferred.when( request.parsedURL.query );
		handleRequest( [ path.join( dir, request.parsedURL.pathname.replace( r_jhpInPath, "$1" ) ) ], request, response );
	}).listen( port );
};
