require("./compile");

var Deferred = require("JQDeferred"),
	fs = require("fs"),
	http = require("http"),
	mime = require("mime"),
	path = require("path"),
	url = require("url"),

	config = require("../package.json"),

	serverInfo = config.name + " v." + config.version,

	r_jhp = /\.jhp$/i,
	r_jhpInPath = /(\.jhp)\/(.*)$/i,
	r_queryContentType = /^application\/x\-www\-form\-urlencoded/;

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
				request.query =
					request.body && r_queryContentType.test( request.headers["content-type"] )
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
				require( filename )( request, response );
			} else {
				var mtime = new Date( stat.mtime ),
					headers = {
						"Server": serverInfo,
						"ETag": JSON.stringify( [ stat.ino, stat.size, +mtime ].join("-") ),
						"Date": ( new Date() ).toUTCString(),
						"Last-Modified": mtime.toUTCString()
					};
				if ( request.headers["if-none-match"] === headers["ETag"]
					|| +( new Date( request.headers["if-modified-since"] ) ) >= +mtime ) {
					response.writeHead( 304, headers );
					response.end();
				} else if ( request.method === "HEAD" ) {
					response.writeHead( 200, headers );
					response.end();
				} else {
					headers["Content-Length"] = stat.size;
					headers["Content-Type"] = mime.lookup( filename );
					response.writeHead( 200, headers );
					fs.createReadStream( filename ).pipe( response );
				}
			}
		}
	});
}

module.exports = function( dir, port ) {
	dir = path.join( process.cwd(), dir );
	process.chdir( dir );
	http.createServer( function( request, response ) {
		if ( request.headers["content-length"] || request.headers["transfer-encoding"] ) {
			request.body = Deferred(function( defer ) {
				var body = "";
				request.on( "data", function( data ) {
					body += data;
				}).on( "end", function() {
					defer.resolve( body );
				});
			}).promise();
		}
		request.parsedURL = url.parse( request.url, true );
		handleRequest( [ path.join( dir, request.parsedURL.pathname.replace( r_jhpInPath, "$1" ) ) ], request, response );
	}).on( "error", function( e ) {
		if ( e.code === "EADDRINUSE" ) {
			console.error( "jhp: cannot open port " + port );
		} else {
			throw e;
		}
	}).listen( port, function() {
		console.log( serverInfo + " - dir: " + dir + " - port: " + port );
	});
};
