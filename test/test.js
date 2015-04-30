var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var postcss = require('postcss');

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));

var cssvariables = require('../');

function testPlugin(filePath, expectedFilePath, options) {
	options = options || {};
	return fs.readFileAsync(filePath)
		.then(function(buffer) {
			var contents = String(buffer);
			var actual = postcss(cssvariables(options)).process(contents);

			return actual.css;
		})
		.then(function(actual) {
			return fs.readFileAsync(expectedFilePath)
				.then(function(buffer) {
					var contents = String(buffer);

					expect(actual.trim()).to.equal(contents.trim());
				});
		});
}

describe('postcss-css-variables', function() {

	
	// Just make sure it doesn't mangle anything
	it('should work when there are no var() functions to consume declarations', function() {
		return testPlugin('./test/fixtures/no-var-func.css', './test/fixtures/no-var-func.expected.css');
	});

	it('should work with variables declared in root', function() {
		return testPlugin('./test/fixtures/root-variable.css', './test/fixtures/root-variable.expected.css');
	});

	it('should work with locally scoped variable in a non-root rule', function() {
		return testPlugin('./test/fixtures/local-variable-non-root.css', './test/fixtures/local-variable-non-root.expected.css');
	});


	describe('with @rules', function() {
		it('should add rule declaration of property in @media', function() {
			return testPlugin('./test/fixtures/media-query.css', './test/fixtures/media-query.expected.css');
		});
		it('should add rule declaration of property in @support', function() {
			return testPlugin('./test/fixtures/support-directive.css', './test/fixtures/support-directive.expected.css');
		});

		it('should work with nested @media', function() {
			return testPlugin('./test/fixtures/media-query-nested.css', './test/fixtures/media-query-nested.expected.css');
		});

		it('should cascade to nested rules', function() {
			return testPlugin('./test/fixtures/cascade-on-nested-rules.css', './test/fixtures/cascade-on-nested-rules.expected.css');
		});
	});

	it('should work with `!important` variable declarations', function() {
		return testPlugin('./test/fixtures/important-variable-declaration.css', './test/fixtures/important-variable-declaration.expected.css');
	});

	it('should work variables that reference other variables', function() {
		return testPlugin('./test/fixtures/variable-reference-other-variable.css', './test/fixtures/variable-reference-other-variable.expected.css');
	});

	it('should work with variables that try to self reference', function() {
		return testPlugin('./test/fixtures/self-reference.css', './test/fixtures/self-reference.expected.css');
	});
	it('should work with variables that try to self reference and fallback properly', function() {
		return testPlugin('./test/fixtures/self-reference-fallback.css', './test/fixtures/self-reference-fallback.expected.css');
	});

	it('should work with circular reference', function() {
		return testPlugin('./test/fixtures/circular-reference.css', './test/fixtures/circular-reference.expected.css');
	});

	describe('with `options.variables`', function() {
		it('should work with JS defined variables', function() {
			return testPlugin(
				'./test/fixtures/js-defined.css',
				'./test/fixtures/js-defined.expected.css',
				{
					variables: {
						'--js-defined1': '75px',
						'--js-defined2': {
							value: '80px'
						}
					}
				}
			);
		});
	});


	describe('with `options.preserve`', function() {
		it('preserves variables when `preserve` is `true`', function() {
			return testPlugin('./test/fixtures/preserve-variables.css', './test/fixtures/preserve-variables.expected.css', { preserve: true });
		});

		it('preserves computed value when `preserve` is `\'computed\'`', function() {
			return testPlugin('./test/fixtures/preserve-computed.css', './test/fixtures/preserve-computed.expected.css', { preserve: 'computed' });
		});
	});


	describe('missing variable declarations', function() {
		it('should work with missing variables', function() {
			return testPlugin('./test/fixtures/missing-variable-usage.css', './test/fixtures/missing-variable-usage.expected.css');
		});

		it('should use fallback value if provided with missing variables', function() {
			return testPlugin('./test/fixtures/missing-variable-should-fallback.css', './test/fixtures/missing-variable-should-fallback.expected.css');
		});
	});

	it('should not parse malformed var() declarations', function() {
		return expect(testPlugin(
			'./test/fixtures/malformed-variable-usage.css', 
			'./test/fixtures/malformed-variable-usage.expected.css'
			)
		).to.eventually.be.rejected;
	});

	describe('rule clean up', function() {
		it('should clean up rules if we removed variable declarations to make it empty', function() {
			return testPlugin('./test/fixtures/remove-empty-rules-after-variable-collection.css', './test/fixtures/remove-empty-rules-after-variable-collection.expected.css');
		});

		it('should clean up neseted rules if we removed variable declarations to make it empty', function() {
			return testPlugin('./test/fixtures/remove-nested-empty-rules-after-variable-collection.css', './test/fixtures/remove-nested-empty-rules-after-variable-collection.expected.css');
		});
	});


});
