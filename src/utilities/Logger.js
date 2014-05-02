var jsface = require("jsface"),
	color  = require("cli-color");

/**
 * @name Logger
 * @namespace 
 * @classdef Logger class, used for all logging inside newman
 */
var Logger = jsface.Class({
	$singleton: true,

	symbols: {
		err: (process.platform === "win32") ? "\u00D7 " : "✗ ",
		ok:  (process.platform === "win32") ? "\u221A " : "✔ "
	},

	/**
	 * Logger Method
	 * @param  {String} log Logs success.
	 * @memberOf Logger
	 */
	success: function(log) {
		process.stdout.write(color.green(log));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs errors.
	 * @memberOf Logger
	 */
	error: function(log) {
		process.stdout.write(color.red(log));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs notice messages.
	 * @memberOf Logger
	 */
	notice: function(log) {
		process.stdout.write(color.cyan(log));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs warning messages.
	 * @memberOf Logger
	 */
	warn: function(log) {
		process.stdout.write(color.yellow(log));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs normal messages.
	 * @memberOf Logger
	 */
	normal: function(log) {
		process.stdout.write(log);
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs light grey messages.
	 * @memberOf Logger
	 */
	light: function(log) {
		process.stdout.write(color.underline.xterm(245)(log));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs orange notes.
	 * @memberOf Logger
	 */
	note: function(log) {
		process.stdout.write(color.xterm(33)(log));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs a test case success
	 * @memberOf Logger
	 */
	testCaseSuccess: function(log) {
		this.success("    " + color.green(this.symbols.ok + log) + "\n");
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs a test case error
	 * @memberOf Logger
	 */
	testCaseError: function(log) {
		process.stdout.write("    " + color.red(this.symbols.err + log) + "\n");
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs a node error in red
	 * @memberOf Logger
	 */
	throwError: function(msg) {
		var err = new Error(msg);
		this.error(color.red(err.message));
		throw err;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs a node exception error in red
	 * @memberOf Logger
	 */
	exceptionError: function(err) {
		this.error("    " + color.bold.red("EXCEPTION - " + err) + "\n");
	}
});

module.exports = Logger;
