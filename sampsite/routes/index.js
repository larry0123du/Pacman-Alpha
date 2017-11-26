var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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
			var collection = db.collection('students');
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

module.exports = router;
