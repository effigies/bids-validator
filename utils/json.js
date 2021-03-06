var Issue = require('./issues').Issue
var JSHINT = require('jshint').JSHINT

module.exports = {
  /**
   * Parse
   *
   * Similar to native JSON.parse but uses
   * a callback structure, jshint for more
   * thorough error reporting and error formatting
   * of the rest of the validator.
   */
  parse: function(file, contents, callback) {
    var jsObj = null
    var err = null
    try {
      jsObj = JSON.parse(contents)
    } catch (exception) {
      err = exception
    } finally {
      if (err) {
        this.jshint(file, contents, function(issues) {
          callback(issues, null)
        })
      } else {
        callback([], jsObj)
      }
    }
  },

  /**
   * JSHint
   *
   * Checks known invalid JSON file
   * content in order to produce a
   * verbose error message.
   */
  jshint: function(file, contents, callback) {
    var issues = []
    if (!JSHINT(contents)) {
      var out = JSHINT.data()
      for (var i = 0; out.errors.length > i; ++i) {
        var error = out.errors[i]
        if (error) {
          issues.push(
            new Issue({
              code: 27,
              file: file,
              line: error.line ? error.line : null,
              character: error.character ? error.character : null,
              reason: error.reason ? error.reason : null,
              evidence: error.evidence ? error.evidence : null,
            }),
          )
        }
      }
    }
    callback(issues)
  },
}
