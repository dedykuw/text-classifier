/**
 * Created by tekwan on 5/18/2017.
 */
const fs = require('fs');
const path = require('path');
const events = require('events');
const es = require('event-stream');
const bayes = require('bayes');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const builder = new xml2js.Builder();
const stopWords = require('./stopwords');
const Stem = require('./stem');

function NaiveClassifier(Config){
    events.EventEmitter.call(this);
    this.index = {};
    this.trainingData = [];
    this.testingData = [];
    this.classifier = bayes();
    this.xml = '';
    this.config = Config;
}

NaiveClassifier.prototype.__proto__ = events.EventEmitter.prototype;

NaiveClassifier.prototype.textProcessor = function (body,config) {
    return body.split(' ').map(function (data, index) {
        if (config.caseFolding){
            data = data.toLowerCase()
        }else if(config.escapeCharacter) {
            data = data.replace(/[^a-zA-Z0-9\u00C0-\u00FF]+/g, ' ').split(' ');
        }else if(config.stopword){
            data = data.filter(function(item) {
                return stopWords.indexOf(item) === -1;
            })
        }else if(config.stem){
            data = data.map(Stem)
        }
        return data;
    }).join(' ');
};

NaiveClassifier.prototype.splitSgml = function () {
    console.log('Splitting SGML file in to Training and Testing data');
    var data = [];
    var arrayOfStreams = [];
    var tempThis = this;

    //create instance of training data write streamer
    var trainingDataWriteStreamer = fs.createWriteStream(path.join(__dirname, '../output', 'trainigdata.sgm'));
    var testingDataWriteStreamer = fs.createWriteStream(path.join(__dirname, '../output', 'testingdata.sgm'));

    // creating array of read stream files inside rawdata folder and merge it
    fs.readdirSync(path.join(__dirname, '../rawdata')).forEach(function (file) {
        arrayOfStreams.push(fs.createReadStream(path.join(__dirname, '../rawdata', file)))
    })

    /*
    * mmerge all file in to one, split by <REUTERS TAG
    * Split it on to training and testing data
    * Write splitted training data
    * */
    es.merge(arrayOfStreams)
        .pipe(es.split('<REUTERS'))
        .pipe(es.map(function (doc, cb) {
            //do something with the line
            parser.parseString('<REUTERS '+doc, function (err, result) {
                if (result != undefined && result != null) {
                    if (result.REUTERS){
                        if (result.REUTERS.$.LEWISSPLIT=="TRAIN" ){
                            //tempThis.trainingData.push(result);
                            trainingDataWriteStreamer.write('<REUTERS '+doc+'\n');
                        }else {
                            //tempThis.testingData.push(result);
                            testingDataWriteStreamer.write('<REUTERS'+doc);
                        }
                    }
                }
            });

            cb(null, doc)
        }))
        .pipe(es.wait(function () {
            setTimeout(function () {
                tempThis.emit('splitEnd');
                trainingDataWriteStreamer.end();
                testingDataWriteStreamer.end();
            }, 5000)
        }))


};
NaiveClassifier.prototype.learnAll =  function () {
    console.log('Now learning all the training data');
    var tempThis = this;
    var counter = 0;

    fs.createReadStream(path.join(__dirname, '../output', 'trainigdata.sgm'))
        .pipe(es.split('<REUTERS'))
        .pipe(es.map(function (doc, cb) {
            // get splitted training data base on reuters tag
            parser.parseString('<REUTERS '+doc, function (err, result) {
                if (result){
                    if (result.REUTERS.TOPICS[0].D != undefined
                        && result.REUTERS.TOPICS[0].D != null
                        && result.REUTERS.TOPICS[0].D.length > 0){

                        result.REUTERS.TOPICS[0].D.forEach(function (TOPIC) {
                            if(result.REUTERS.TEXT[0].BODY != undefined && result.REUTERS.TEXT[0].BODY.length > 0) {
                                if (TOPIC){
                                    tempThis.classifier.learn(tempThis.textProcessor(result.REUTERS.TEXT[0].BODY[0],tempThis.config), TOPIC);
                                    counter = counter+1;
                                }
                            }
                        });
                    }
                }

            });

            cb(null, doc)
        }))
        .pipe(es.wait(function () {
            setTimeout(function () {
                tempThis.emit('learnEnd');
                console.log(counter+ ' Documents learned');
            },5000)
        }))

};
NaiveClassifier.prototype.testOne = function (body) {
    return this.classifier.categorize(this.textProcessor(body,this.config))
};
NaiveClassifier.prototype.testAll = function () {
    console.log('Now testing all test data!! ');
    var tempCounter = 0;
    var counter = 0;
    var tempThis = this;

    var testedDataWritestreamer = fs.createWriteStream(path.join(__dirname, '../output', 'testdatatested.sgm'));
    fs.createReadStream(path.join(__dirname, '../output', 'testingdata.sgm'))
        .pipe(es.split('<REUTERS'))
        .pipe(es.mapSync(function (doc, cb) {
            // get splitted training data base on reuters tag
            if (doc.length > 0) {
                parser.parseString('<REUTERS'+doc, function (err, result) {
                    if (err) console.log(err)
                        if (result.REUTERS.TEXT[0].BODY == undefined) tempCounter = tempCounter+1
                        if (result.REUTERS.TEXT[0].BODY != undefined) {
                            result.REUTERS.TOPICS = [tempThis.testOne(result.REUTERS.TEXT[0].BODY[0])];
                            result.REUTERS.$.TOPICS = 'YES';
                            counter = counter + 1;
                            testedDataWritestreamer.write(builder.buildObject(result) + '\n\n');
                        }


                });
                parser.reset()
            }
        }))
        .pipe(es.wait(function () {
            setTimeout(function () {
                console.log('Testing all test data completed!!, '+counter+' document tested!!');
                console.log(tempCounter+' documents without text body');
                tempThis.emit('testAllEnd');
                tempThis.emit('createXMLEnd');

            },5000)
        }))

};
NaiveClassifier.prototype.createXMLFile = function (fileName) {

    var tempThis = this;
    this.testingData.forEach(function (data, index, allData) {
        tempThis.xml += builder.buildObject(data)+'\n\n' ;
    });
    var stream = fs.createWriteStream(path.join(__dirname, '../output', 'testdatatested.sgm'));
    stream.once('open', function(fd) {
        stream.write(tempThis.xml);
        stream.end();
        tempThis.emit('createXMLEnd');
    });
};
module.exports = NaiveClassifier;