var fs = require("fs"),
	path = require("path"),
	defaults = {
		"public": "./public",
		port: 80
	},
	handlers = {
		"public": function( val ) {
			return path.join( this.folder, val );
		}
	};

module.exports = {
	read: function( folder, callback ) {
		fs.readFile( path.join( folder, "package.json" ), "utf8", function( err, config ) {
			var key;
			if ( err ) {
				throw err;
			}
			config = JSON.parse( config );
			config.folder = folder;
			for( key in defaults ) {
				if ( !config[ key ] ) {
					config[ key ] = defaults[ key ];
				}
				if ( handlers[ key ] ) {
					config[ key ] = handlers[ key ].call( config, config[ key ] );
				}
			}
			callback( config );
		});
	},
	defaults: defaults
};
