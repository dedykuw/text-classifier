var NaiveClassifier = require('./mymodule/NaiveClassifier');
var naive = new NaiveClassifier();
const readline = require('readline');

naive.splitSgml();
naive.on('splitEnd',function () {
    naive.learnAll()
});
naive.on('learnEnd',function () {
    naive.testAll();
});


naive.on('testAllEnd',function () {
});

naive.on('createXMLEnd',function () {
    console.log('Classifying test file finished, please wait until output file written completely in to folder named \'output\' !!');
    var inputText = '';
    var rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt(' \n you can  type your test data body text here (end it with \'end>\') in new line, \n or type \'exit1\' to quit > ');
    rl.prompt();
    rl.on('line', function(line) {
        if (line === "exit1") rl.close();
        inputText += line;
        if (line === "end>"){
            console.log('Topic : '+naive.testOne(inputText));
            rl.prompt();
        }
    }).on('close',function(){
        process.exit(0);
    });
});



