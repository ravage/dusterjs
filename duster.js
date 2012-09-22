#!/usr/bin/env node

// duster.js
// Watch directory of dust.js templates and automatically compile them
// by Dan McGrady http://dmix.ca
//

/*jshint node: true */

var
argv = require('optimist'),
fs = require('fs'),
dust = require('dustjs-linkedin'),
watch = require('watch'),
path = require('path'),
util = require('util'),
outputPath,
inputPath;

argv = argv.usage('Usage: $0 -i [input path] -o [output path]');
argv = argv.demand(['i','o']).argv;

inputPath = argv.i;
outputPath = path.resolve(argv.o);

if (!fs.existsSync(inputPath)) {
  console.error('%s', 'Could not find input path in the file system!');
  process.exit(0);
}
else if (!fs.existsSync(outputPath)) {
  console.error('%s', 'Could not find output path in the file system!');
  process.exit(0);
}

function handleDirectories(directory, directories) {
  var i, length;

  for (i = 0, length = directories.length; i < length; i++) {
    directory = path.join(directory, directories[i]);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, '0755');
    }
  }

  return directory;
}

function compileDust(incoming, curr, prev) {
  var
  filename,
  compiled,
  relativePath,
  directories,
  i,
  length,
  templateName,
  out = outputPath;

  fs.readFile(incoming, function(err, data) {
    if (err && err.code === 'EISDIR') {
      return;
    }

    relativePath = path.relative(inputPath, incoming);
    filename = util.format('%s.%s', path.basename(relativePath, '.dust'), 'js');
    templateName = relativePath.replace(path.extname(relativePath), '');
    directories = relativePath.split(path.sep);
    directories.pop();

    out = handleDirectories(out, directories);

    out = path.join(out, filename);
    compiled = dust.compile(data.toString(), templateName);

    fs.writeFile(out, compiled, function(err) {
      if (err) {
        throw err;
      }
      console.info(util.format('Wrote: %s', out));
    });
  });
}

watch.createMonitor(inputPath, function (monitor) {
  console.log("Watching " + inputPath);
  monitor.files['*.dust'];
  monitor.on("created", compileDust);
  monitor.on("changed", compileDust);
});
