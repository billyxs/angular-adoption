/**
 * Parse Dog and Cat breeds from HTML
 */

var fs = require('fs'),
    readline = require('readline');

// Dog Data
var dogRd = readline.createInterface({
    input: fs.createReadStream('dog-breeds.txt'),
    output: process.stdout,
    terminal: false
});

var dogOutput = [{name:'Any', value:''}];
dogRd.on('line', function(line) {
  if (line && line.length) {
    var items = line.substring( 0, line.indexOf('">') ).replace('<option value="', '').split('|');

    // don't include names that are Quoted
    if (items[1].indexOf('&quot;') === -1 && items[1].indexOf('Ain\'t Nothin\' but a Hound Dog!') === -1) {
      dogOutput.push( {name:items[1], value:items[0]} );
    }
  }
});

dogRd.on('close', function() {
  console.log(dogOutput);
  fs.writeFile('dog-breeds.json', JSON.stringify(dogOutput), function(err) {
      if(err) {
        return console.log(err);
      }

      console.log("Dog breeds file was saved!");
  });


});

// Cat Data
var catRd = readline.createInterface({
    input: fs.createReadStream('cat-breeds.txt'),
    output: process.stdout,
    terminal: false
});

var catOutput = [{name:'Any', value:''}];
catRd.on('line', function(line) {
  if (line && line.length) {
    var nameline = line.substring( (line.indexOf('>') + 1), line.indexOf('</option>') );
    var valueline = line.substring( 0, line.indexOf('">') ).replace('<option value="', '').split(';')[0];

    // don't include names that are Quoted
    if (valueline.indexOf('&quot;') === -1) {
      catOutput.push( {name:nameline, value:valueline} );
    }
  }
});

catRd.on('close', function() {
  console.log(catOutput);
  fs.writeFile('cat-breeds.json', JSON.stringify(catOutput), function(err) {
      if(err) {
        return console.log(err);
      }

      console.log("Cat breeds file was saved!");
  });
});






