var jsface                  = require('jsface'),
	_und                    = require('underscore'),
	vm                      = require('vm'),
	ErrorHandler            = require('../utilities/ErrorHandler'),
	AbstractResponseHandler = require('./AbstractResponseHandler'),
	window                  = require("jsdom-nogyp").jsdom().parentWindow,
	_jq                     = require("jquery")(window),
	_lod                    = require("lodash"),
	Helpers                 = require('../utilities/Helpers'),
	log                     = require('../utilities/Logger'),
	Backbone                = require("backbone"),
	xmlToJson               = require("xml2js"),
	Globals                 = require("../utilities/Globals"),
    ResponseExporter        = require("../utilities/ResponseExporter"),
	tv4                     = require("tv4");
require('sugar');
/**
 * @class TestResponseHandler
 * @classdesc
 */
var TestResponseHandler = jsface.Class(AbstractResponseHandler, {
	$singleton: true,
    throwErrorOnLog: false,
	// function called when the event "requestExecuted" is fired. Takes 4 self-explanatory parameters
	_onRequestExecuted: function(error, response, body, request) {
		var results = this._runTestCases(error, response, body, request);
		AbstractResponseHandler._onRequestExecuted.call(this, error, response, body, request, results);
		this._logTestResults(results);

        if(this.throwErrorOnLog!==false) {
            ResponseExporter.exportResults();
            ErrorHandler.terminateWithError(this.throwErrorOnLog);
        }
	},

	_runTestCases: function(error, response, body, request) {
		if (this._hasTestCases(request)) {
			var tests = this._getValidTestCases(request.tests);
			var sandbox = this._createSandboxedEnvironment(error, response, body, request);
			return this._runAndGenerateTestResults(tests, sandbox);
		}
		return {};
	},

	_hasTestCases: function(request) {
		return !!request.tests;
	},

	// returns an array of test cases ( as strings )
	_getValidTestCases: function(tests) {
		return _und.reduce(tests.split(';'), function(listOfTests, testCase) {
			var t = testCase.trim();
			if (t.length > 0) {
				listOfTests.push(t);
			}
			return listOfTests;
		}, []);
	},

	// run and generate test results. Also exit if any of the tests has failed
	// given the users passes the flag
	_runAndGenerateTestResults: function(testCases, sandbox) {
		var testResults = this._evaluateInSandboxedEnvironment(testCases, sandbox);
        var testResultsToReturn = {};
		if (Globals.stopOnError) {
            for (var key in testResults) {
                if (testResults.hasOwnProperty(key)) {
                    if (!testResults[key]) {
                        testResultsToReturn[key]=false;
                        this.throwErrorOnLog="Test case failed: " + key;
                        return testResultsToReturn;
                    }
                    else {
                        testResultsToReturn[key]=true;
                    }
                }
            }
		}
        else {
            testResultsToReturn = testResults;
        }
		return testResultsToReturn;
	},
  
	// evaluates a list of testcases in a sandbox generated by _createSandboxedEnvironment
	// catches exceptions and throws a custom error message
	_evaluateInSandboxedEnvironment: function(testCases, sandbox) {
		var sweet= "for(p in sugar.object) Object.prototype[p]  = sugar.object[p];";
		sweet += "for(p in sugar.array)  Array.prototype[p]   = sugar.array[p];";
		sweet += "for(p in sugar.string) String.prototype[p]  = sugar.string[p];";
		sweet += "for(p in sugar.date)   Date.prototype[p]    = sugar.date[p];";
		sweet += "for(p in sugar.funcs)  Function.prototype[p]= sugar.funcs[p];";
		testCases = sweet + 'String.prototype.has = function(value){ return this.indexOf(value) > -1};' + testCases.join(";");
		try {
			vm.runInNewContext(testCases, sandbox);
		} catch (err) {
			ErrorHandler.exceptionError(err);
		}
		return sandbox.tests;
	},

    _getTransformedRequestData: function(request) {
        var transformedData;

        if (request.transformed.data === "") {
            return {};
        }
        if (request.dataMode === "raw") {
            transformedData = request.transformed.data;
        } else {
            transformedData = Helpers.transformFromKeyValue(request.transformed.data);
        }
        return transformedData;
    },

	// sets the env vars json as a key value pair
	_setEnvironmentContext: function() {
		return Helpers.transformFromKeyValue(Globals.envJson.values);
	},

	_createSandboxedEnvironment: function(error, response, body, request) {
		var sugar = { array:{}, object:{}, string:{}, funcs:{}, date:{} };
		Object.getOwnPropertyNames(Array.prototype).each(function(p) { sugar.array[p] = Array.prototype[p];});
		Object.getOwnPropertyNames(Object.prototype).each(function(p) { sugar.object[p] = Object.prototype[p];});
		Object.getOwnPropertyNames(String.prototype).each(function(p) { sugar.string[p] = String.prototype[p];});
		Object.getOwnPropertyNames(Date.prototype).each(function(p) { sugar.date[p] = Date.prototype[p];});
		Object.getOwnPropertyNames(Function.prototype).each(function(p) { sugar.funcs[p] = Function.prototype[p];});
		return {
			sugar: sugar,
			tests: {},
			responseHeaders: response.headers,
			responseBody: body,
			responseTime: response.stats.timeTaken,
			request: {
				url: request.transformed.url,
				method: request.method,
				headers: Helpers.generateHeaderObj(request.transformed.headers),
				data: this._getTransformedRequestData(request),
				dataMode: request.dataMode
			},
			responseCode: {
				code: response.statusCode,
				name: request.name,
				detail: request.description
			},
			data: {},
			iteration: Globals.iterationNumber,
			environment: this._setEnvironmentContext(),
			globals: {},
			$: _jq,
			_: _lod,
			Backbone: Backbone,
			xmlToJson: function(string) {
				var JSON = {};
				xmlToJson.parseString(string, {explicitArray: false,async: false}, function (err, result) {
					JSON = result;
				});
				return JSON;
			},
			tv4: tv4,
			console: {log: function(){}},
			postman: {
				setEnvironmentVariable: function(key, value) {
					var envVar = _und.find(Globals.envJson.values, function(envObject){
						return envObject["key"] === key;
					});

					if (envVar) { // if the envVariable exists replace it
						envVar["value"] = value;
					} else { // else add a new envVariable
						Globals.envJson.values.push({
							key: key,
							value: value,
							type: "text",
							name: key
						});
					}
				},
				setGlobalVariable: function(key, value) {
					// Set this guy up when we setup globals.
				}
			}
		};
	},

	// logger for test case results
	_logTestResults: function(results) {
		_und.each(_und.keys(results), function(key) {
			if (results[key]) {
				log.testCaseSuccess(key);
			} else {
				ErrorHandler.testCaseError(key);
			}
		});
	}
});

module.exports = TestResponseHandler;
