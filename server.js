var http = require('http');
var url  = require('url');
var MongoClient = require('mongodb').MongoClient; 
var mongourl = 'mongodb://daiboyu:boyu123456@ds157247.mlab.com:57247/assignment';
//var mongourl = 'mongodb://localhost:27017/test';
var express = require('express');
var assert = require('assert');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();
var ObjectId = require('mongodb').ObjectID;
var fileUpload = require('express-fileupload');


app = express();

var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';

app.set('view engine','ejs');

app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2],
  
  
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	}
	else{
		MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err,null);
			console.log('Connected to MongoDB\n');
			findAllRestaurants(db,function(restaurants) {
				db.close();
				console.log('Disconnected MongoDB\n');
			
		res.writeHead(200, {"Content-Type": "text/html"});
				res.write('<html><head><title>Hello</title></head>');
				res.write('Hello '+req.session.username +'<br>');
				res.write('<a href="/logout">logout</a>');
				res.write('<body><H1>Restaurants</H1>');
				res.write('<a href="/create">Create new Restaurants</a>');
				res.write('<br/>');
				res.write('<a href="/search">Search Restaurants</a>');
				res.write('<H2>Showing '+restaurants.length+' Restaurants</H2>');
	//console.log(restaurants);
				res.write('<ol>');
				for (var i in restaurants) {
					res.write('<li><a href="/detail?name='+restaurants[i].name+'">'+restaurants[i].name+'</a></li>');
				}
				res.write('</ol>');
				res.end('</body></html>');
			});
		});
	}
});

app.get('/login',function(req,res) {
	res.sendFile(__dirname + '/public/login.html');
});


app.get('/create',function(req,res) {
	if (!req.session.authenticated) {
		res.redirect('/login');
	}
	console.log(req.session.username);
	res.sendFile(__dirname + '/public/restaurant.html');
});

app.get('/search',function(req,res) {
	if (!req.session.authenticated) {
		res.redirect('/login');
	}
	console.log(req.session.username);
	res.sendFile(__dirname + '/public/search.html');
});

app.post('/search',function(req,res) {
	if (!req.session.authenticated) {
		res.redirect('/login');
	}
	var valueSearch = {};
	valueSearch[req.body.criteria]=req.body.value;
	console.log(valueSearch);
	MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err,null);
			console.log('Connected to MongoDB\n');
	displayRestaurant(db,valueSearch,function(restaurants) {
				db.close();
				console.log('Disconnected MongoDB\n');
				console.log("3."+restaurants);
		if (restaurants != null){
			res.render('gmap', {restaurant:restaurants});
		}else{
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write('<html><head><title>Search Fail</title></head>');
			res.write('<body> Maybe the Restuarant is no exist ');
			res.write('<br>');
			res.write('<a href="/search">'+ 'go back'+ '</a>');	
			res.end('</body></html>');
		}
	
				
				
			});
	});
	
	
});


app.get('/detail',function(req,res){
	if (!req.session.authenticated) {
		res.redirect('/login');
	}
	var parsedURL = url.parse(req.url,true); 
	var queryAsObject = parsedURL.query;
	console.log(queryAsObject);
// read detail
	MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err,null);
			console.log('Connected to MongoDB\n');
			displayRestaurant(db,queryAsObject,function(restaurants) {
				db.close();
				console.log('Disconnected MongoDB\n');
				//console.log(queryAsObject);
				req.session.rating = restaurants.rating;
				//console.log("1."+restaurants.rating[0].owner);
				//console.log("2."+restaurants.rating[0].score);
				res.render('gmap', {restaurant:restaurants});
	
				
				
			});
		
	});


});

app.post('/rate',function(req,res){
var rated=0;
//console.log(req.session.username);

	if (!req.session.authenticated) {
		res.redirect('/login');
	}else{
		if (req.session.rating != undefined){
	  		for(var i=0; i< req.session.rating.length; i++){
				console.log(req.session.rating[i].owner);
				if (req.session.username == req.session.rating[i].owner){
					rated =1;	
				}
          		 }
		}
		if (rated != 1){		
			MongoClient.connect(mongourl, function(err, db) {	
				assert.equal(err,null);
				console.log('Connected to MongoDB\n');
				addRate(db,req.body.name,req.body.score,req.session.username);
				db.close();
				console.log('Disconnected from MongoDB\n');
				res.redirect('/');
			});
		}else{
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write('<html><head><title>Rate Fail</title></head>');
			res.write('<body>Each Resturant only allow each user rate once ');
			res.write('<br>');
			res.write('<a href="/">'+ 'go back'+ '</a>');	
			res.end('</body></html>');
	

		}
	
	}
});


app.post('/reg',function(req,res){
var users = {};
    if(req.body.password == req.body.password2){
	users['userid'] = req.body.userid;
	users['password'] = req.body.password;	
	console.log(users);
	MongoClient.connect(mongourl, function(err, db) {	
	assert.equal(err,null);
	console.log('Connected to MongoDB\n');
	db.collection('users').insertOne(users,function(err,result) {
		assert.equal(err,null);
		console.log("Register was successful _id = " +JSON.stringify(result.insertedId));
		db.close();
		console.log('Disconnected from MongoDB\n');
		});
	});
	res.redirect('/login');
    }
     else{
	res.writeHead(200, {"Content-Type": "text/html"});
	res.write('<html><head><title>Register Fail</title></head>');
	res.write('<body>Register Fail Please Re-Register again ');
	res.write('<br>');
	res.write('Maybe Your Password are different at second times');
	res.write('<br>');
	res.write('<a href="reg.html">'+ 'Register again'+ '</a>');
				
	res.end('</body></html>');
	
	}
});

app.post('/login',function(req,res) {
     var find =0;
     MongoClient.connect(mongourl, function(err, db) {
	assert.equal(err,null);
	console.log('Connected to MongoDB\n');
	findAllUsers(db,function(users) {
		db.close();
		console.log('Disconnected MongoDB\n');
		for (var i=0; i<users.length; i++) {
			if (users[i].userid == req.body.userid && users[i].password == req.body.password) {
				req.session.authenticated = true;
				req.session.username = users[i].userid;
				console.log(req.session.username);
				find =1;
				res.redirect('/');
				
		       }
		}
		if(find !=1 ){
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write('<html><head><title>Register Fail</title></head>');
		res.write('<body>You do not have any account !');
		res.write('<a href="/">'+ 'Go Back'+ '</a>');		
		res.end('</body></html>');
		}
	
	});
	
     });

 });

app.get('/edit',function(req,res){
var parsedURL = url.parse(req.url,true); 
var queryAsObject = parsedURL.query;
	if (!req.session.authenticated) {
		res.redirect('/login');
	}
	if(req.session.username != queryAsObject.owner){
	res.writeHead(200, {"Content-Type": "text/html"});
	res.write('<html><head><title>Register Fail</title></head>');
	res.write('<body>You do not have any permission to edit!');
	res.write('<a href="/">'+ 'Go Back'+ '</a>');		
	res.end('</body></html>');
	}else{
	
	console.log(queryAsObject);
// read detail
	MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err,null);
			console.log('Connected to MongoDB\n');
			displayRestaurant(db,queryAsObject,function(restaurants) {
				db.close();
				console.log('Disconnected MongoDB\n');
	
	console.log(restaurants);
	
				res.render('editpage', { restaurant: restaurants});
			});
		});
	}

});

app.use(fileUpload());   // add 'files' object to req

app.post('/update',function(req,res) {
	if (!req.session.authenticated) {
		res.redirect('/login');
	}
	console.log(req.session.username);
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true})); 
    if(req.body.rname != null){
	var r = {};  // new restaurant to be inserted
	r['owner'] = req.session.username;
	r['address'] = {};
	r.address.street = (req.body.street != null) ? req.body.street : null;
	r.address.zipcode = (req.body.zipcode != null) ? req.body.zipcode : null;
	r.address.building = (req.body.building != null) ? req.body.building : null;
	r.address['coord'] = [];
	r.address.coord.push(req.body.lon);
	r.address.coord.push(req.body.lat);
	r['borough'] = (req.body.borough != null) ? req.body.borough : null;
	r['cuisine'] = (req.body.cuisine != null) ? req.body.cuisine : null;
	r['name'] = (req.body.rname != null) ? req.body.rname : null;
	//r['rating'] = 0;
	r['restaurant_id'] = (req.body.restaurant_id != null) ? req.body.restaurant_id : null;
	r['data'] = new Buffer(req.files.view.data).toString('base64');
	//r['data'] = new Buffer(req.files.view.data).toString('base64') ? req.files.view.data : null ;
	
    	r['mimetype'] = req.files.view.mimetype  ? req.files.view.mimetype : null ;
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		db.collection('restaurants').update({"name" :r['name'] },{$set :r},function(err,result) {
				assert.equal(err,null);
				console.log("update was successful _id = " +
					JSON.stringify(result.insertedId));
				db.close();
				console.log('Disconnected from MongoDB\n');
				res.redirect('/');
		//res.render('gmap', { restaurant: r});
				
			});
	});
     }
	else{
	res.writeHead(200, {"Content-Type": "text/html"});
			res.write('<html><head><title>Update Fail</title></head>');
			res.write('<body>update Fail Please Re-update again ');
			res.write('<br>');
			
			res.write('<br>');
			res.write('<a href="/">'+ 'update again'+ '</a>');
				
			res.end('</body></html>');
	}

});




app.get('/delete',function(req,res){
	if (!req.session.authenticated) {
		res.redirect('/login');
	}
	var parsedURL = url.parse(req.url,true); 
	var queryAsObject = parsedURL.query;
	console.log(req.session.username);
	console.log(queryAsObject.owner);
	if(req.session.username != queryAsObject.owner){
	res.writeHead(200, {"Content-Type": "text/html"});
	res.write('<html><head><title>Register Fail</title></head>');
	res.write('<body>You do not have any permission to delete!');
	res.write('<a href="/">'+ 'Go Back'+ '</a>');		
	res.end('</body></html>');
	}else{
		deleteMany(res,queryAsObject);
	res.writeHead(200, {"Content-Type": "text/html"})
	res.write('<html><body>Delete was successful!');
	res.write('<a href="/">'+ 'Go Back'+ '</a>');		
	res.end('</body></html>');
			
			
	}

});


app.get('/logout',function(req,res) {
	req.session = null;
	res.redirect('/');
});

//app.use(fileUpload());   // add 'files' object to req

app.post('/create',function(req,res) {
console.log("1");
	if (!req.session.authenticated) {
		res.redirect('/login');
	}
	console.log(req.session.username);
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true})); 
    if(req.body.rname != null){
	console.log("2");
	var r = {};  // new restaurant to be inserted
	r['owner'] = req.session.username;
	r['address'] = {};
	r.address.street = (req.body.street != null) ? req.body.street : null;
	r.address.zipcode = (req.body.zipcode != null) ? req.body.zipcode : null;
	r.address.building = (req.body.building != null) ? req.body.building : null;
	r.address['coord'] = [];
	r.address.coord.push(req.body.lon);
	r.address.coord.push(req.body.lat);
	//r['lon'] = (req.body.lon != null) ? req.body.lon : null;
	//r['lat'] = (req.body.lat != null) ? req.body.lat : null;
	r['borough'] = (req.body.borough != null) ? req.body.borough : null;
	r['cuisine'] = (req.body.cuisine != null) ? req.body.cuisine : null;
	r['name'] = (req.body.rname != null) ? req.body.rname : null;
	//r['rating'] = 0;
	r['restaurant_id'] = (req.body.restaurant_id != null) ? req.body.restaurant_id : null;
	r['data'] = new Buffer(req.files.view.data).toString('base64');
	//r['data'] = new Buffer(req.files.view.data).toString('base64') ? req.files.view.data : null ;
	
    	r['mimetype'] = req.files.view.mimetype  ? req.files.view.mimetype : null ;
	//console.log(r);	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		db.collection('restaurants').insertOne(r,function(err,result) {
				assert.equal(err,null);
				console.log("insertOne() was successful _id = " +
					JSON.stringify(result.insertedId));
				db.close();
				console.log('Disconnected from MongoDB\n');
		//res.writeHead(200, {"Content-Type": "text/plain"});
				//res.end('Insert was successful ' + JSON.stringify(r));		
		//console.log(r)
				res.render('gmap', { restaurant: r});
				
		});
	});
     }
	else{
	res.writeHead(200, {"Content-Type": "text/html"});
			res.write('<html><head><title>Create Fail</title></head>');
			res.write('<body>Create Fail Please Re-Create again ');
			res.write('<br>');
			res.write('Restaurant Name is Necessary!');
			res.write('<br>');
			res.write('<a href="res.html">'+ 'Create again'+ '</a>');
				
			res.end('</body></html>');
	}

});

//Resful
app.get('/api/create/:name/:owner/:street/:zipcode/:building/:lon/:lat/:borough/:cuisine/:restaurant_id', function(req,res){
  console.log(req.params.name );
  MongoClient.connect(mongourl, function(err, db) {
  assert.equal(err,null);
  console.log('Connected to MongoDB\n');
  findRestaurants(db,{name: req.params.name},function(restaurants) {
    db.close();
    if(restaurants.length == 0){

    var r = {};
    r['owner'] = req.params.owner;
    r['address'] = {};
	  r.address.street = (req.params.street != null) ? req.params.street : null;
	  r.address.zipcode = (req.params.zipcode != null) ? req.params.zipcode : null;
	  r.address.building = (req.params.building != null) ? req.params.building : null;
	  r.address['coord'] = [];
	  r.address.coord.push(req.params.lon);
	  r.address.coord.push(req.params.lat);
	  r['borough'] = (req.params.borough != null) ? req.params.borough : null;
	  r['cuisine'] = (req.params.cuisine != null) ? req.params.cuisine : null;
	  r['name'] = (req.params.name != null) ? req.params.name : null;
	  r['rating'] = 0;
	  r['restaurant_id'] = (req.params.restaurant_id != null) ? req.params.restaurant_id : null;
	  r['photo'] = null
    r['mimetype'] = null ;


    MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		db.collection('restaurants').insertOne(r,function(err,result) {
				assert.equal(err,null);
				console.log("insertOne() was successful _id = " +
					JSON.stringify(result.insertedId));
				db.close();
				console.log('Disconnected from MongoDB\n');

        res.json({status : "ok" , _id : result.insertedId });
        res.end();



			   });
	   });

}else
  res.json({status : "failed"  });
});
});
})
app.get('/api/read/name/:read_object', function(req,res){
  console.log(req.params.read_object);

  var obj = req.params.read_object;

  MongoClient.connect(mongourl, function(err, db) {
  assert.equal(err,null);
  console.log('Connected to MongoDB\n');
  findRestaurants(db,{name: req.params.read_object},function(restaurants) {


      db.close();
      console.log('Disconnected from MongoDB\n');

      res.json(restaurants);
      res.end();



       });
   });

 });



 app.get('/api/read/borough/:read_object', function(req,res){
   console.log(req.params.read_object);

   var obj = req.params.read_object;

   MongoClient.connect(mongourl, function(err, db) {
   assert.equal(err,null);
   console.log('Connected to MongoDB\n');
   findRestaurants(db,{borough: req.params.read_object},function(restaurants) {


       db.close();
       console.log('Disconnected from MongoDB\n');

       res.json(restaurants);
       res.end();



        });
    });

  })


  app.get('/api/read/cuisine/:read_object', function(req,res){
    console.log(req.params.read_object);

    var obj = req.params.read_object;

    MongoClient.connect(mongourl, function(err, db) {
    assert.equal(err,null);
    console.log('Connected to MongoDB\n');
    findRestaurants(db,{cuisine: req.params.read_object},function(restaurants) {


        db.close();
        console.log('Disconnected from MongoDB\n');

        res.json(restaurants);
        res.end();



         });
     });

   })
function findRestaurants(db,criteria,callback) {
	var restaurants = [];
	//cursor = db.collection('restaurants').find(criteria).limit(20);
	cursor = db.collection('restaurants').find(criteria);
	cursor.each(function(err, doc) {
		assert.equal(err, null);
		if (doc != null) {
			restaurants.push(doc);
		} else {
			callback(restaurants);
		}
	});
};

function findAllRestaurants(db,callback) {
	var restaurants = [];
	//cursor = db.collection('restaurants').find().limit(20);
	cursor = db.collection('restaurants').find();
	cursor.each(function(err, doc) {
		assert.equal(err, null);
		if (doc != null) {
			restaurants.push(doc);
		} else {
			callback(restaurants);
		}
	});
};
	
function findAllUsers(db,callback){
	var users = [];
     	MongoClient.connect(mongourl, function(err, db) {	
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		cursor = db.collection('users').find();
		cursor.each(function(err,doc){
			assert.equal(err, null);
			if (doc != null) {
				users.push(doc);
		
			} else {
				callback(users);
			}
		})
	})
};

function displayRestaurant(db,criteria,callback) {
	MongoClient.connect(mongourl, function(err, db) {
	assert.equal(err,null);
	console.log('Connected to MongoDB\n');
	db.collection('restaurants').findOne(criteria,function(err,restaurants) {
		assert.equal(err,null);
		db.close();			
		console.log('Disconnected from MongoDB\n');
		callback(restaurants);				
			});
		});
};


function deleteMany(res,queryAsObject) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		db.collection('restaurants').deleteMany(queryAsObject,
			function(err,result) {
				assert.equal(err,null);
				console.log("deleteMany() was successful _id = " +
					JSON.stringify(queryAsObject));
				db.close();
				
			});
	});
};

function addRate(db,name,score,owner){
	db.collection('restaurants').update(
		{"name": name },
		{$push:
			{"rating":{"score" :score,
				 "owner": owner}
			}
		},
		function (err,result){
			if(err){
				result = err;
				console.log("update: " + JSON.stringify(err));
			}

		}

	)
};



app.listen(process.env.PORT || 8099);
