// tests for VariableProcessor
var assert = require('assert'),
	sinon  = require('sinon'),
	fs     = require('fs'),
	JSON5  = require('JSON5'),
	path   = require('path'),
	_und   = require('underscore');

var VariableProcessor = require('../src/utilities/VariableProcessor.js');

describe("Variable Processor", function() {
	beforeEach(function() {
		var filePath = path.join(__dirname, 'data', 'PostmanCollection.json');
		var envFile = path.join(__dirname, 'data', 'Environment.js');

		this.collectionJson = JSON5.parse(fs.readFileSync(filePath, 'utf8'));
		this.environmentJson = JSON5.parse(fs.readFileSync(envFile, 'utf8'));
	});

	it("should replace correct env variable once", function() {
		var sampleReq = this.collectionJson.requests[0];

		sampleReq.url = "{{url}}/blog/edit";
		this.environmentJson.values[0] = {"key": "url", "value": "http://localhost"};

		VariableProcessor.getProcessedRequest(sampleReq, { 
			envJson: this.environmentJson 
		});

		assert.equal(sampleReq.url, "http://localhost/blog/edit");
	});

	it("should not replace incorrect env variable", function() {
		var sampleReq = this.collectionJson.requests[0];

		sampleReq.url = "{{url}}/blog/edit";
		this.environmentJson.values[0] = {"key": "noturl", "value": "http://localhost"};

		VariableProcessor.getProcessedRequest(sampleReq, { 
			envJson: this.environmentJson 
		});

		assert.equal(sampleReq.url, "{{url}}/blog/edit");
	});

	it("should replace multiple correct env variable", function() {
		var sampleReq = this.collectionJson.requests[0];

		sampleReq.url = "{{url}}/blog/edit/{{post_id}}";
		this.environmentJson.values[0] = {"key": "url", "value": "http://localhost"};
		this.environmentJson.values[1] = {"key": "post_id", "value": "1"};

		VariableProcessor.getProcessedRequest(sampleReq, { 
			envJson: this.environmentJson 
		});

		assert.equal(sampleReq.url, "http://localhost/blog/edit/1");
	});
});
