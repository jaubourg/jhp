var program = require("commander"),
	config = require("../package.json"),
	found = false;

program
.	version( config.version );

program
.	command("start")
.	description("starts the server")
.	option("-d, --dir [path]", "root directory", "." )
.	option("-p, --port [number]", "port number", function( val ) {
		var int = parseInt( val );
		if ( isNaN( int ) || int < 0 || int > 65535 ) {
			console.error("jhp: invalid port number '" + val + "'");
			process.exit( -1 );
		}
		return int;
	}, 80 )
.	action(function( options ) {
		found = true;
		require("../lib/server")( options.dir, options.port );
	});

program
.	parse(process.argv);

if ( !found ) {
	program.parse( [ "node", "jhp", "--help" ] );
}
