var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var User = require('../models/user');
var server = require('http').Server(router);
var io = require('socket.io')(server);

var score;


/* GET home page. */
router.get('/', function(req, res, next) {
	console.log("HERE!");
	var path = require('path');
 return res.sendFile(path.resolve('views/index2.html'));
 //	res.render('index');
 // res.render('index2.html');
  console.log("Done!");
//  res.redirect('newplayer');
});

router.post('/', function (req, res, next) {
  // confirm that user typed same password twice
  if (req.body.password !== req.body.passwordConf) {
    var err = new Error('Passwords do not match.');
    err.status = 400;
    res.send("passwords dont match");
    return next(err);
  }

  if (req.body.email &&
    req.body.username &&
    req.body.password &&
    req.body.passwordConf) {

    var userData = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      passwordConf: req.body.passwordConf,
      highScore: 0,
      gamesPlayed: 0,
    }

    User.create(userData, function (error, user) {
      if (error) {
return next(error);
      } else {
        req.session.userId = user._id;
        return res.redirect('/profile');
      }
    });

  } else if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function (error, user) {
      if (error || !user) {
        var err = new Error('Wrong email or password.');
        err.status = 401;
        return next(err);
      } else {
        req.session.userId = user._id;
        return res.redirect('/profile');
      }
});
  } else {
    var err = new Error('All fields required.');
    err.status = 400;
    return next(err);
  }
})

// GET route after registering
router.get('/profile', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        if (user === null) {
          var err = new Error('Not authorized! Go back!');
          err.status = 400;
          return next(err);
        } else {
        	res.render('userprofile2');
          //return res.send('<h1>Name: </h1>' + user.username + '<h2>Mail: </h2>' + user.email + '<br><a type="button" href="/logout">Logout</a>')
        }
      }
    });
});


// GET for logout logout
router.get('/logout', function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});


router.get('/getleaderboard', function(req, res, next) {
	var MongoClient = mongodb.MongoClient;

	var url = 'mongodb://localhost:27017/sampsite';

	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect to the server', err);
		}else{
			console.log("Connection Established");
			var collection = db.collection('players');
			collection.find({}).sort({score:-1}).limit(10).toArray(function(err, result){
				if(err){
					res.send(err);
				}
				else if(result.length){
					res.render('leaderboard', {
						"leaderboard":result
					});
				}
				else
				{
					res.send('No documents found');
				}
				db.close();
			});
		}

	});
});

router.get('/thelist', function(req, res){
	var MongoClient = mongodb.MongoClient;

	var url = 'mongodb://localhost:27017/sampsite';

	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect to the server', err);
		}
		else
		{
			console.log("Connection Establisher");
			var collection = db.collection('User');
			collection.find({}).toArray(function(err, result){
				if(err){
					res.send(err);

				}
				else if(result.length){
					res.render('studentlist', {
						"studentlist":result
					});
				}
				else
				{
					res.send('No documents found');
				}
				db.close();
			});
		}
	});
});


router.get('/newplayer', function(req, res){
	res.render('newplayer', {title: 'Game Over! Add Your Name!'});
})

router.get('/newstudent', function(req, res){
	res.render('newstudent', {title: 'Add Student'});
});

router.post('/addplayer', function(req, res){
	var MongoClient = mongodb.MongoClient;

	var url = 'mongodb://localhost:27017/sampsite';

	MongoClient.connect(url, function(err, db){
		if(err){
			console.log("Unable to connect to server", err)
		}else{
			console.log("Connected to server");
			var collection = db.collection('players');
			var player1 = {player: req.body.player, score: (parseInt(req.body.score)), message: req.body.message};
			console.log(typeof(req.body.score));

			collection.insert([player1], function(err, result){
				if(err){
					console.log("Unable to insert new player", err);
				}
				else
				{
					res.redirect("getleaderboard");
				}

				db.close();
			});
		}
	});
});

router.post('/addstudent', function(req, res){
	var MongoClient = mongodb.MongoClient;

	var url = 'mongodb://localhost:27017/sampsite';

	MongoClient.connect(url, function(err, db){
		if(err){
			console.log("Unable to connect to server", err)
		}
		else{
			console.log("Connected to server");

			var collection = db.collection('students');

			var student1 = {student: req.body.student, street: req.body.street, city: req.body.city, state: req.body.state, sex: req.body.sex, gpa: req.body.gpa};

			collection.insert([student1], function(err, result){
				if(err){
					console.log(err);
				}
				else
				{
					res.redirect("thelist");
				}

				db.close();
			});
		}
	});
});

io.on('connection', function(client){
	console.log('Client connected...');
	client.on('score', function(data){
		score = data;
		console.log("Got score:"+data.score);
	});
});

server.listen(3001, function(){
	console.log('listening on:3001');
});



module.exports = router;
