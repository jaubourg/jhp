JavaScript Hypertext Preprocessor
=================================

You had nightmares about it, the frenchman did it!

## WTF?

JHP brings a PHP-like approach to Node.JS programming. To make it brief it's a *"best of both worlds"*, *"worse of both worlds"* kind of deal.

## Install and run

`npm install jhp -g`

In a folder, create a package.json file with the following elements:

```javascript
{
	"public": "path/to/htdocs",
	"port": 8080
}
```

Where:
* `public` is the root of the web server,
* `port` is the port the server has to listen to.

Then, in the command line: `jhp start path/to/folder/with/config` (by default `jhp` will look into the current directory)

## Use

In the main public folder, create `index.jhp`:

```javascript
<?
	response.setHeader( "Content-Type", "text/plain" );
	response.write( request.url );
	request.end();
```

So, yes, it's pretty much the same as PHP:
* files with the `.jhp` extension will be executed by the server,
* while other files will be passed verbatim to the client (like a static file server would).

`response` and `request` are the same objects you'd have in a `http.createServer` handler. Except that `request` has several new fields:
* `body`, a promise that gets resolved with the request body (if and when the request has a body)

  ```javascript
	<?
		request.body.done(function( body ) {
			response.end( body );
		});
  ```

* `query`, a promise that gets resolved with the merge of both GET and POST parameters

  ```javascript
	<?
		response.setHeader( "Content-Type", "text/plain" );
		request.query.done(function( query ) {
			for ( var key in query ) {
	?>
	<?= key ?>: <?= query[ key ] ?>
	<?
			}
  			response.end();
		});
  ```

* parsedURL, the request url as parsed by `require("url").parse( url, true )`

*(the promises are implemented by [JQDeferred](/jaubourg/jquery-deferred-for-node))*

**Remember**: this is still Node.JS we're talking about, so always call `reponse.end()` when you wanna flush the response!

## What now?

JHP is meant as a rapid prototyping and testing environment, nothing more, nothing less. It won't toast your bread.

It is licensed under both the GPLv2 and the MIT licenses.

JHP is pretty fresh out of the oven, code is crude and features are sparse...

So it needs **you**:
* what kind of pluggable architecture should it have?
* what built-in feature is it lacking?

What we intend to work on right now is the static file serving part.
