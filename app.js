/**
 * Module dependencies.
 */

var express = require('express'), app = module.exports = express.createServer();

// MongoDB
var mongoose = require('mongoose'), db = mongoose
    .connect('mongodb://127.0.0.1/neuronmaps'),
// create the movie Model using the 'movies' collection as a data-source
NeuronMap = mongoose.model('neuronmap', new mongoose.Schema({
  name : String,
  mapsdata : String,
  updatetime : Date,
  archived : Boolean
}));

// Configuration
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());// parse JSON into objects
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({
    dumpExceptions : true,
    showStack : true
  }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res) {
  res.redirect('/index.html');
});

app.get('/neuronmaps', function(req, res) {
  NeuronMap.find({'archived' : false}, function(err, maps) {
    res.contentType('json');
    res.json({
      success : true,
      data : maps
    });
  });
});

app.get('/neuronmaps/:id', function(req, res) {
  NeuronMap.find({
    _id : req.params.id
  }, function(err, maps) {
    res.contentType('json');
    res.json({
      success : true,
      data : maps
    });
  });
});

app.put('/neuronmaps:id', function(req, res) {
  console.log(req.body.name);
  console.log(req.body.mapsdata);
  res.json({
    success : true,
    data : {
      "hello" : "world"
    }
  });
});

app.post('/neuronmaps', function(req, res) {
  var data = req.body;
  var map = new NeuronMap({
    name : data.name,
    mapsdata : data.mapsdata,
    updatetime : new Date(),
    archived : false
  });
  map.save(function(err, map) {
    res.contentType('json');
    res.json({
      success : !err,
      data : {
        "meg" : "done"
      }
    });
  });
});

app.del('/neuronmaps/:id', function(req, res) {
  NeuronMap.find({
    _id : req.params.id
  }, function(err, maps) { // update db var movie = movies[0];
    var map = maps[0];
    map.set('archived', true);
    map.save(function(err) {
      res.contentType('json');
      res.json({
        success : !err,
        data : {"msg" : "done"}
      });
    });
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode",
    app.address().port, app.settings.env);
