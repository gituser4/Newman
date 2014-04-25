var jsface       = require('jsface'),
	ErrorHandler = require('./ErrorHandler'),
	Helpers      = require('./Helpers'),
	_und         = require('underscore');

/** 
 * @name VariableProcessor
 * @namespace
 * @classdesc Helper singleton class that does the variable and environment processing for newman
 */
var VariableProcessor = jsface.Class({
	$singleton: true,

	// TODO: Make {{}} configurable 
	$statics: {
		ENV_REGEX: /\{\{([a-z0-9\-._]+)\}\}/ig,

		// negative match for 4 digit numbers to weed out port number matches
		PATH_REGEX: /\:(?![0-9]{4})+(([a-z0-9\-._]+))/,

		FUNCTION_REGEX: /\{\{\$([a-z0-9\-._]+)\}\}/ig
	},

	// placeholders to define function variables
	getFunctionVariables: {
		guid: function() {},
		timestamp: _und.now(),
		randomInt: _und.random(0, 1000)
	},

	// updates request url by the replacing it with pathVariables
	_processPathVariable: function(request) {
		if (typeof request.pathVariables !== undefined) {
			request.url = this._findReplace(request.url, request.pathVariables, this.PATH_REGEX);
		}
	},
	
	// updates request properties by the replacing them with function variables
	_processFunctionVariable: function(request) {
		var properties = ["url", "headers", "form", "data"];
		_und.each(properties, function(prop) {
			// check if the prop exists
			if (request[prop] !== undefined)  {
				if (typeof request[prop] === "string") {
					// if string, use directly
					request[prop] = this._findReplace(request[prop], this.getFunctionVariables, this.FUNCTION_REGEX);
				} else {
					// if not string, stringify it
					// findReplace, unstringify it and set it
					var jsonifiedProp = JSON.stringify(request[prop]);
					var parsedJsonProp = JSON.parse(this._findReplace(jsonifiedProp, this.getFunctionVariables, this.FUNCTION_REGEX));
					request[prop] = parsedJsonProp;
				}
			}
		}, this);
	},

	// replaces a string based on keys in the sourceObject as matched by a regex. Supports recursive replacement
	// usage: _findReplace("{{url}}/blog/posts/{{id}}", {url: "http://localhost", id: 2}, this.ENV_REGEX)
	// Note: The regex provided should capture the key to be replaced (use parenthesis)
	_findReplace: function(stringSource, sourceObject, REGEX) {
		function getKey(match, key){
			return sourceObject[key];
		}
		stringSource = stringSource.replace(REGEX, getKey);

		if (stringSource.match(REGEX)){
			return this._findReplace(stringSource, sourceObject, REGEX);
		}
		return stringSource;
	},

	// transforms the request as per the environment json data passed
	_processEnvVariable: function(request, envJson) {
		var kvpairs = envJson.values;
		
		if (kvpairs === undefined) {
			ErrorHandler.parseError("Incorrect environment JSON file.\n");
			return false;
		}

		request.transformed = {};

		var properties = ["url", "headers", "form", "data"];

		var pairObject = Helpers.transformFromKeyValue(kvpairs);
		_und.each(properties, function(prop) {
			// check if the prop exists
			if (request[prop] !== undefined)  {
				if (typeof request[prop] === "string") {
					// if string, use directly
					request.transformed[prop] = this._findReplace(request[prop], pairObject, this.ENV_REGEX);
				} else {
					// if not string, stringify it
					// findReplace, unstringify it and set it
					var jsonifiedProp = JSON.stringify(request[prop]);
					var parsedJsonProp = JSON.parse(this._findReplace(jsonifiedProp, pairObject, this.ENV_REGEX));
					request.transformed[prop] = parsedJsonProp;
				}
			}
		}, this);
		return true;
	},


	/** 
	 * Modifies request by processing all the variables
	 * @param {RequestModel} request
	 * @memberof VariableProcessor
	 * @param {JSON} options passed to Newman runner
	 */
	processRequestVariables: function(request, options) {
		this._processPathVariable(request);
		this._processFunctionVariable(request);
		this._processEnvVariable(request, options.envJson);
	}
});

module.exports = VariableProcessor;
