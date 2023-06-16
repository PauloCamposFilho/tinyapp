// const { render } = require("ejs");
const express = require("express");
const cookieSession = require("cookie-session");
const morgan = require('morgan');
const methodOverride = require("method-override");
const app = express();
const PORT = 8080; // default port 8080
const { shortURLCodeExists, getUrlsByUser, userOwnsUrl, generateRandomString, parseLongURL, isUserLoggedIn, generatePassword, userIsRegistered, getUrlObj } = require("./helpers");
const { urlDatabase, users } = require("./database");

// engine specific settings | Middleware

app.set("view engine", "ejs");                   // define EJS as engine
app.use(express.urlencoded({ extended: true })); // make buffer readable.
app.use(morgan('dev'));                          // print every http request to console.
app.use(cookieSession({
  name: 'session',
  keys: ["someReallyWrongAndSuperSecretSecretForSure", "AndYetAnothersUpErDuPerSecretSecret", "AndWhatDoYouKnowItsYetAnotherSuPeRduperSecretForrealsSecret!"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours.
}));
app.use(methodOverride("_method"));

// -----------------------

// Routing (GET)

// default route. checks if user is logged in and redirects accordingly if necessary.
app.get("/", (req, res) => {
  if (!isUserLoggedIn(req.session, users)) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

// "main" route where all URLs belonging to the logged in user are displayed.
// checks to see if the user is logged in, and if not, redirects to login page.
app.get("/urls", (req, res) => {
  const templateVars = { user: {} };
  templateVars.user = users[req.session["user_id"]];
  if (!isUserLoggedIn(req.session, users)) {
    return res.status(401).redirect("/login");
  }
  templateVars.urls = getUrlsByUser(templateVars.user, urlDatabase);
  res.render("urls_index", templateVars);
});

// route to get the form for a new shortURL creation. Redirects if user is not logged in.
app.get("/urls/new", (req, res) => {
  const templateVars = { user: {} };
  templateVars.user = users[req.session["user_id"]];
  if (!isUserLoggedIn(req.session, users)) {
    return res.status(401).redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// route to get information about a given shortCode (comes in as the "id" parameter). Also used for editing it.
// verifies that the user is logged in, that the shortcode exists, and that the logged in user owns/has permission to edit it.
// redirects appropriately or displays error message.
app.get("/urls/:id", (req, res) => {
  const templateVars = { user: {} };
  const shortURLCode = req.params.id;
  templateVars.user = users[req.session["user_id"]];

  if (!isUserLoggedIn(req.session, users)) {
    return res.status(401).redirect("/login");
  }
  
  if (!shortURLCodeExists(shortURLCode, urlDatabase)) {
    templateVars.message = `Invalid ShortCode`;
    return res.status(400).render("showMessage", templateVars);
  }
  
  if (!userOwnsUrl(templateVars.user, shortURLCode, urlDatabase)) {
    templateVars.message = `Access Denied. You do not have access to view/edit ${shortURLCode}`;
    return res.status(401).render("showMessage", templateVars);
  }
  templateVars.url = getUrlObj(shortURLCode, urlDatabase);

  console.log(templateVars.url);
  
  res.render("url_shows", templateVars);
});

// route to get the registration form for the service.
// redirects to GET /urls if user is already logged in.
app.get("/register", (req, res) => {
  const templateVars = { user: {} };
  if (!isUserLoggedIn(req.session, users)) {
    return res.render("user_register", templateVars);
  }
  res.redirect("/urls");
});

// route to get the login form for the service.
// redirects to GET /urls if user is already logged in.
app.get("/login", (req, res) => {
  const templateVars = { user: {} };
  if (!isUserLoggedIn(req.session, users)) {
    return res.render("login", templateVars);
  }
  res.redirect("/urls");
});

// route used to redirect the user to the actual URL, when given a shortcode (the "id" parameter)
// displays a 404 error message if the code does not exist.
app.get("/u/:id", (req, res) => {
  const templateVars = { user: {} };
  templateVars.user = users[req.session["user_id"]]; // in case we are going to show a 404 due to invalid/nonexistent shortcode, keep user context so the header renders properly.
  const longURL = urlDatabase[req.params.id];
  if (longURL) {    
    if (!req.session[req.params.id]) { // you've never been here before... unique visitor!
      urlDatabase[req.params.id].uniqueVisitors += 1;      
      req.session[req.params.id] = generateRandomString(6); // tag user with a cookie so that we can recognize them if they re-use the shortURL, and also use as a visitor_id
    }
    urlDatabase[req.params.id].numberOfUses += 1;
    urlDatabase[req.params.id].visits.push([new Date(), req.session[req.params.id]]);
    res.redirect(urlDatabase[req.params.id].longURL);
  } else {
    templateVars.message = `Invalid shortCode: ${req.params.id}`;
    res.status(404).render("showMessage", templateVars);
  }
});

//  ROUTING (POST)

// route to post a new shortURL into the database.
// verifies that the user is logged in, and that a URL was given.
// displays a relevant error message in fail case.
app.post("/urls", (req, res) => {
  const templateVars = { user: {} };
  templateVars.user = users[req.session["user_id"]];

  if (!isUserLoggedIn(req.session, users)) {
    templateVars.message = "Cannot create short URL. User is not logged in.";
    return res.status(401).render("showMessage", templateVars);
  }
  
  if (!req.body.longURL) {
    templateVars.message = "The URL cannot be empty.";
    return res.status(400).render("showMessage", templateVars);
  }

  const shortURL = generateRandomString(6);
  const newLink = {
    longURL: parseLongURL(req.body.longURL),
    userId: templateVars.user.id,
    creationDate: new Date(),
    numberOfUses: 0,
    uniqueVisitors: 0,
    visits: []
  };

  urlDatabase[shortURL] = newLink;
  res.redirect(`/urls/${shortURL}`);
});

// route to post a delete requisition, removing a shortURL from the database.
// verifies that the shortURL exists, the user is logged in, and that they have the relevant permission/access-level for it.
// displays relevant errors in fail cases.
app.delete("/urls/:id/delete", (req, res) => {
  const templateVars = { user: {} };
  templateVars.user = users[req.session["user_id"]];

  if (!shortURLCodeExists(req.params.id, urlDatabase)) {
    console.log("I shouldnt be here...");
    templateVars.message = `Invalid ShortCode`;
    return res.status(400).render("showMessage", templateVars);
  }

  if (!isUserLoggedIn(req.session, users) || !userOwnsUrl(templateVars.user, req.params.id, urlDatabase)) {
    templateVars.message = `Access Denied. You do not have access to delete ${req.params.id}`;
    return res.status(401).render("showMessage", templateVars);
  }
  
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// route to post an update requisition, editing the shortURL in the database.
// verifies that the shortURL exists, the user is logged in, and that they have the relevant permission/access-level for it.
// in case that a shortURL tries to be updated with a null/undefined/empty value, it will not update the value and will just redirect to the main route (/)
app.put("/urls/:id/update", (req, res) => {
  const templateVars = { user: {} };
  templateVars.user = users[req.session["user_id"]];

  if (!shortURLCodeExists(req.params.id, urlDatabase)) {
    templateVars.message = `Invalid ShortCode`;
    return res.status(400).render("showMessage", templateVars);
  }

  if (!isUserLoggedIn(req.session, users) || !userOwnsUrl(templateVars.user, req.params.id, urlDatabase)) {
    templateVars.message = `Access Denied. You do not have access to update ${req.params.id}`;
    return res.status(401).render("showMessage", templateVars);
  }
  
  if (req.body.longURL) {
    urlDatabase[req.params.id].longURL = parseLongURL(req.body.longURL);
  }
  res.redirect("/");
});

// route to post the login form information.
// verifies that the user is registered (compares both email and password) through the return from userIsRegistered function
// displays relevant error message if the credentials are invalid.
app.post("/login", (req, res) => {
  const templateVars = { user: {} };
  const userInformation = userIsRegistered({ email: req.body.email, password: req.body.password }, true, users);
  if (!userInformation) {
    templateVars.message = "User and/or Password invalid.";
    return res.status(403).render("showMessage", templateVars);
  }
  if (req.body.email) {
    req.session["user_id"] = userInformation.id;
  }
  res.redirect("/urls");
});

// route to post the registration form.
// verifies that the form input is complete, and that a user with the same email does not yet exist.
// displays relevant error message in fail cases.
app.post("/register", (req, res) => {
  const templateVars = { user: {} };
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  if (!user.email || !user.password) {
    templateVars.message = "Please make sure to input both an email AND password.";
    return res.status(400).render("showMessage", templateVars);
  }

  if (userIsRegistered(user, false, users)) {
    templateVars.message = "User already registered. Please login instead or register new user.";
    return res.status(400).render("showMessage", templateVars);
  }

  user.id = generateRandomString(6);
  user.password = generatePassword(user.password);
  users[user.id] = user;
  templateVars.user = user;
  req.session["user_id"] = user.id;

  res.redirect("/urls");
});

// route to post the logout action
// clears cookies and redirects user.
app.post("/logout", (req, res) => {
  //req.session = null; // clear cookies.
  req.session["user_id"] = null; // only clear the login cookie. Keep the unique visitor tracking.
  res.redirect("/login");
});

// initialization.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});