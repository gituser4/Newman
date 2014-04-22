var jsface          = require("jsface"),
	IterationRunner = require("./runners/IterationRunner"),
	CollectionModel = require('./models/CollectionModel'),
	Globals          = require('./utilities/Globals'),
	Options          = require('./utilities/Options');

/**
 * @name Newman
 * @classdesc Bootstrap Newman class, mixin from Options class
 * @namespace
 */
var Newman = jsface.Class([Options], {
	$singleton: true,

	/**
	 * Executes XHR Requests for the Postman request, and logs the responses 
	 * & runs tests on them.
	 * @param  {JSON} requestJSON Takes the Postman Collection JSON from a file or url.
	 * @memberOf Newman
	 * @param {object} Newman options
	 */
	execute: function(requestJSON, options) {
		Globals.addEnvironmentGlobals(requestJSON, options);
		this.setOptions(options);

		// initialize the collection model from raw json
		var collectionModel = new CollectionModel(requestJSON);

		// refers to the collection of processed requests
		var orderedCollection = collectionModel.getOrderedRequests(this.getOptions());

		// setup the iteration runner with processed collection and options
		this.iterationRunner = new IterationRunner(orderedCollection, this.getOptions());

		this.iterationRunner.execute();
	}
});

module.exports = Newman;
