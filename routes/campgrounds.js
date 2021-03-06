var express 	 = require("express"),
	router 		 = express.Router(),
	Campground   = require("../models/campground"),
	Comment   	 = require("../models/comment"),
	middleware	 = require("../middleware"),
	NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.MAP_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

router.get("/", function(req, res) {
	Campground.find({}, function(err, allCampgrounds) {
		if (err) {
			console.log(err);
		} else {
			res.render("campgrounds/index", {campgrounds: allCampgrounds});
		}
	});
});

router.post("/", middleware.isLoggedIn, function(req, res) {
	var name = req.body.name;
	var price = req.body.price;
	var img = req.body.image;
	var desc = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || !data.length) {
		  console.log(err);
		  req.flash('error', 'Invalid address');
		  return res.redirect('back');
		}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;
		var newCampground = {name: name, price: price, image: img, description: desc, author:author, location: location, lat: lat, lng: lng};
		Campground.create(newCampground, function(err, newlyCreated) {
			if (err) {
				console.log(err);
			} else {
				res.redirect("/campgrounds");
			}
		});
	});
});

router.get("/new", middleware.isLoggedIn, function(req, res) {
	res.render("campgrounds/new");
});

router.get("/:id", function(req, res) {
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
		if (err || !foundCampground) {
			req.flash("error", "Campground not found");
			res.redirect("back");
		} else {
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});

router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
	Campground.findById(req.params.id, function(err, foundCampground){
		if (err) {
			res.redirect("/campgrounds");
		} else {
			res.render("campgrounds/edit", {campground: foundCampground});
		}
	});
});

router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    // find and update the correct campground
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || !data.length) {
		  req.flash('error', 'Invalid address');
		  return res.redirect('back');
		}
		req.body.campground.lat = data[0].latitude;
		req.body.campground.lng = data[0].longitude;
		req.body.campground.location = data[0].formattedAddress;

		Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
			if (err) {
				req.flash("error", err.message);
				res.redirect("/campgrounds");
			} else {
				req.flash("success","Successfully Updated!");	
				res.redirect("/campgrounds/" + req.params.id);
			}
		});
	});
});

router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
	Campground.findByIdAndRemove(req.params.id, function(err, campgoundRemoved){
        if (err) {
           res.redirect("/campgrounds");
       	} 
	   	Comment.deleteMany({_id: {$in: campgoundRemoved.comments} }, function(err) {
		    if (err) {
				console.log(err);
		    }
       		res.redirect("/campgrounds");
	   	});
    });
});

module.exports = router;