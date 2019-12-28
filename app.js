var express     	= require("express"),
    app         	= express(),
    bodyParser     	= require("body-parser"),
    mongoose       	= require("mongoose"),
	flash		   	= require("connect-flash"),
    passport       	= require("passport"),
    LocalStrategy  	= require("passport-local"),
	methodOverride 	= require("method-override"),
    Campground  	= require("./models/campground"),
    Comment     	= require("./models/comment"),
    User        	= require("./models/user"),
    seedDB      	= require("./seeds");

var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index");

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);

var mongodb_url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp";
mongoose.connect(mongodb_url);
seedDB();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
	next();
});

app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments",commentRoutes);
app.use(indexRoutes);


app.listen(process.env.PORT || 3000, function() {
	console.log("start the server on port 3000");
});