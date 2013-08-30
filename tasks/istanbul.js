module.exports = function(grunt) {
	grunt.registerMultiTask('coverageInstrument', 'Instrument source files.', function() {
		var fs = require('fs');
		var istanbul = require('istanbul');
		if (!istanbul) {
			grunt.fail.warn("Cannot load istanbul module");
		}
		var instrumenter = new istanbul.Instrumenter();
		if (!instrumenter) {
			grunt.fail.warn("Cannot create istanbul.Instrumenter");
		}
		var options = this.options({
		});
		var dest = this.data.dest;
		
		grunt.file.delete(dest);

		this.files.forEach(function(filePair) {
			var isExpandedPair = filePair.orig.expand || false;

			filePair.src.forEach(function(src) {
				var dest;
				if (grunt.util._.endsWith(filePair.dest, '/')) {
					dest = (isExpandedPair) ? filePair.dest : unixifyPath(path.join(filePair.dest, src));
				} else {
					dest = filePair.dest;
				}

				if (grunt.file.isDir(src)) {					
					grunt.file.mkdir(dest);					
				} else {
					grunt.verbose.write('Instrumenting ' + src.cyan + ' -> ' + dest.cyan + '...');
					var code = instrumenter.instrumentSync(String(fs.readFileSync(src)), src);
					grunt.log.muted = true;
					grunt.file.write(dest, code);
					grunt.log.muted = false;
					grunt.verbose.writeln('OK'.green);
				}
			});
		});
	});

	grunt.registerMultiTask('coverageReport', 'Create reports from collected coverage info', function () {
		var options = this.options({
			coverageFile: '',
			reports: {}
		});
		var coverageFile = options.coverageFile;
		if (!coverageFile) {
			grunt.fail.warn('Option coverageFile wasn\'t specified');
		}
		var istanbul = require('istanbul');
		if (!istanbul) {
			grunt.fail.warn("Cannot load istanbul module");
		}
		
		var coverage = grunt.file.readJSON(coverageFile);
		if (!coverage) {
			grunt.log.writeln('No coverage info found');
			return;
		}

		var Report = istanbul.Report;
		var Utils = istanbul.utils;
		var collector = new istanbul.Collector();

		// add coverage information to the collector
		grunt.verbose.write('Parsing coverage data...');
		collector.add(coverage);
		grunt.verbose.writeln('OK'.green);

		// store coverage data for cmd output
		coverage = Utils.summarizeCoverage(collector.getFinalCoverage());
		if (coverage && coverage.lines) {
			grunt.log.ok('Coverage:');
			grunt.log.ok('-  Lines: ' + coverage.lines.pct + '%');
			grunt.log.ok('-  Statements: ' + coverage.statements.pct + '%');
			grunt.log.ok('-  Functions: ' + coverage.functions.pct + '%');
			grunt.log.ok('-  Branches: ' + coverage.branches.pct + '%');
		}

		// geretage reports
		Object.keys(options.reports).forEach(function (reportName) {
			var dir = options.reports[reportName];
			if (!dir) {
				grunt.log.warn('No directory was specified for ' + reportName + ' report');
			} else {
				grunt.log.write('Generating coverage ' + reportName + ' report...');
				Report.create('html', {dir: dir}).writeReport(collector, true);
				grunt.log.writeln('OK'.green + ' (in ' + dir + ')');
			}
		});
	});

};