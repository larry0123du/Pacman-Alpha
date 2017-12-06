const path = require('path');
var express = require('express');
var http = require('http');
var router = express();
// var router = express.Router();
var mongodb = require('mongodb');
var User = require('../models/user');
// var server = require('http').Server(router);

// 2 lines commented out
// var server = http.createServer(router);
// const SocketServer = require('ws').Server;

// router.use('/', express.static(__dirname));

var score;
var Id;
var spid;

// commented out
// var port = process.env.PORT || 8000;

/* GET home page. */
router.get('/', function(req, res, next) {
	console.log("HERE!");
	var path = require('path');
 return res.sendFile(path.resolve('views/indexTest.html'));
 //	res.render('index');
 // res.render('index2.html');
  console.log("Done!");
//  res.redirect('newplayer');
});

// 3 lines commeneted out
// server.listen(port, function(){
// 	console.log('listening on: ' + port);
// });

// webSocket commented out
// const wss = new SocketServer({ server: server });
// wss.on('connection', (ws) => {
// 	console.log('Client connected');
// 	// wss.clients.forEach((client) => {
// 	// 	client.send('hello');
// 	// });
// 	ws.send('hello');
// 	ws.on('close', () => console.log('connection disconnected'));
// });


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

router.get('/singleplayer', function(req, res, next){
	//return res.send('<form action="/singleplayer" method="post">							<input type="submit" value="LOGIN NOW">				</form>')
	var path = require('path');
	spid = req.session.userId;
	res.render('pacman', {"id": spid});

	
});

router.post('/singlePlayer', function(req, res, next){
	console.log("POST singleplayer");
	User.findById(req.session.userId)
	.exec(function(error, user){
			if(error)
				console.log('Can\'t find user!!');

			console.log("Email:"+user.email+ "\nusername:"+user.username+"\nPW:"+user.password+"\nPWConf:"+user.passwordConf+"\nGP:"+user.gamesPlayed);
			user.password = user.passwordConf;
			user.gamesPlayed = user.gamesPlayed + 1;
			score = 5;
			if(score > user.highScore)
			{	
				user.highScore = score;
			}
			else
				user.highScore = user.highScore;

			console.log("Email:"+user.email+ "\nusername:"+user.username+"\nPW:"+user.password+"\nPWConf:"+user.passwordConf+"\nGP:"+user.gamesPlayed);

			user.save().then(function (err){
				if(err){
					console.log('UPDATE ERROR!');
				}

				res.redirect('/profile');
			});
	});

});

router.post('/endGame', function(req, res, next){
	console.log("POST SinglePlayer");
	User.findById(req.session.userId)
	.exec(function(error, user){
		if(error)
			console.log("Can\'t find user!");

		console.log("Email:"+user.email+"\nusername:"+user.username);
		user.password = user.passwordConf;
		user.gamesPlayed = user.gamesPlayed + 1;
		if(req.body.score > user.highScore)
			user.highScore = req.body.score;

		user.save().then(function (err){
			if(err){
				console.log('Mongoose Error maybe');
			}

			res.redirect('/profile');
		});
	});
});

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

        	var status;
        	if(user.gamesPlayed <= 5)
        		status = "Newbie";
        	else if(user.gamesPlayed <= 20)
        		status = "Rookie";
        	else if(user.gamesPlayed <= 50)
        		status = "Amateur";
        	else if(user.gamesPlayed <= 100)
        		status = "Veteran";
        	else
        		status = "Master";



        	User.find({}).sort({'highScore': -1}).limit(3).exec(function(err, posts){
        		var topScore = "empty";
//        		console.log(""+posts[0].highScore+" "+posts[1].highScore+" "+posts[2].highScore+" ");	
        		if(user.highScore == posts[0].highScore)
        			topScore = "images/gold.svg";
        		else if(user.highScore == posts[1].highScore)
        			topScore = "images/silver.png";
        		else if(user.highScore == posts[2].highScore)
        			topScore = "images/bronze.png";
        		else
        			topScore = "images/nomedal.svg";
        		console.log("\n"+topScore);

	        	res.render('userprofile2', {
        		"user":user,
        		"medal":topScore,
        		"status":status
        	});
        	});




          //return res.send('<h1>Name: </h1>' + user.username + '<h2>Mail: </h2>' + user.email + '<br><a type="button" href="/logout">Logout</a>')
        }
      }
    });
});

router.post('/findUser', function(req,res, next){
	console.log("IN SEARCH POST REQUEST");
	// console.log("REQUEST:"+req.body);
	console.log("REQUEST:"+req.body.user);
	User.find({username: "admin6"}).exec(function(error, user) {
		if (error) {
        return next(error);
      } else {
        if (user === null) {
          var err = new Error('Not authorized! Go back!');
          err.status = 400;
          return next(err);
        } else {

        	var status;
        	if(user.gamesPlayed <= 5)
        		status = "Newbie";
        	else if(user.gamesPlayed <= 20)
        		status = "Rookie";
        	else if(user.gamesPlayed <= 50)
        		status = "Amateur";
        	else if(user.gamesPlayed <= 100)
        		status = "Veteran";
        	else
        		status = "Master";



        	User.find({}).sort({'highScore': -1}).limit(3).exec(function(err, posts){
        		var topScore = "empty";
//        		console.log(""+posts[0].highScore+" "+posts[1].highScore+" "+posts[2].highScore+" ");	
        		if(user.highScore == posts[0].highScore)
        			topScore = "images/gold.svg";
        		else if(user.highScore == posts[1].highScore)
        			topScore = "images/silver.png";
        		else if(user.highScore == posts[2].highScore)
        			topScore = "images/bronze.png";
        		else
        			topScore = "images/nomedal.svg";
        		console.log("\n"+topScore);

	        	res.render('userprofile2', {
        		"user":user,
        		"medal":topScore,
        		"status":status
        	});
        	});




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

	var url = 'mongodb://eharian:123@ds129966.mlab.com:29966/pacrush';

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

	//var url = 'mongodb://localhost:27017/sampsite';
	var url = 'mongodb://eharian:123@ds129966.mlab.com:29966/pacrush';

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

//	var url = 'mongodb://localhost:27017/sampsite';
	var url = 'mongodb://eharian:123@ds129966.mlab.com:29966/pacrush';

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

	//var url = 'mongodb://localhost:27017/sampsite';

	var url = 'mongodb://eharian:123@ds129966.mlab.com:29966/pacrush';
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

// const io = socketIO(server);

// io.on('connection', function(client){
// 	console.log('Client connected...');
// 	client.on('score', function(data){
// 		score = data;
// 		console.log("Got score:"+data.score);
// 		client.emit('redirect', '/profile');
// 	});
// });



module.exports = router;
