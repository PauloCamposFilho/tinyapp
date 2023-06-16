// const { render } = require("ejs");
const express = require("express");
const cookieSession = require("cookie-session");
const morgan = require('morgan');
const app = express();
const PORT = 8080; // default port 8080
const { shortURLCodeExists, getUrlsByUser, userOwnsUrl, generateRandomString, parseLongURL, isUserLoggedIn, generatePassword, userIsRegistered, getUserIdFromCredentials } = require("./helpers");

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "a2b3c4",
    creationDate: new Date(),
    numberOfUses: 0
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "a2b3c4",
    creationDate: new Date(),
    numberOfUses: 0
  },
  "v9smk3": {
    longURL: "http://www.yahoo.com",
    userId: "bv12cd",
    creationDate: new Date(),
    numberOfUses: 0
  },
  "vh8sdx": {
    longURL: "http://www.example.com",
    userId: "bv12cd",
    creationDate: new Date(),
    numberOfUses: 0
  }
};

const users = {
  a2b3c4: {
    id: "a2b3c4",
    email: "a@a.com",
    password: "1234",
  },
  bv12cd: {
    id: "bv12cd",
    email: "b@b.com",
    password: "4321",
  },
};

// engine specific settings | MIDDLEWARE
app.set("view engine", "ejs"); // define EJS as engine
app.use(express.urlencoded({ extended: true })); // make buffer readable.
app.use(morgan('dev')); // print every http request to console.
app.use(cookieSession({
  name: 'session',
  keys: ["someReallyWrongAndSuperSecretSecretForSure", "AndYetAnothersUpErDuPerSecretSecret", "AndWhatDoYouKnowItsYetAnotherSuPeRduperSecretForrealsSecret!"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours.
}));

// -----------------------

// Routing (GET)

app.get("/", (req, res) => {
  if (!isUserLoggedIn(req.session, users)) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = { user: {} };
  templateVars.user = users[req.session["user_id"]];
  if (!isUserLoggedIn(req.session, users)) {
    return res.status(401).redirect("/login");
  }
  templateVars.urls = getUrlsByUser(templateVars.user, urlDatabase);
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: {}
  };
  templateVars.user = users[req.session["user_id"]];
  if (!isUserLoggedIn(req.session, users)) {
    return res.status(401).redirect("/login");
  }
    
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: {}
  };
  templateVars.user = users[req.session["user_id"]];
  if (!isUserLoggedIn(req.session, users)) {
    return res.status(401).redirect("login");
  }
  
  if (!shortURLCodeExists(req.params.id, urlDatabase)) {
    templateVars.message = `Invalid ShortCode`;
    return res.status(400).render("showMessage", templateVars);
  }

  if (!userOwnsUrl(templateVars.user, req.params.id, urlDatabase)) {
    templateVars.message = `Access Denied. You do not have access to view/edit ${req.params.id}`;
    return res.status(401).render("showMessage", templateVars);
  }
  templateVars.id = req.params.id;
  templateVars.longURL = urlDatabase[templateVars.id].longURL;
  
  res.render("url_shows", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: {}
  };
  if (!isUserLoggedIn(req.session, users)) {
    return res.render("user_register", templateVars);
  }
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: {}
  };
  if (!isUserLoggedIn(req.session, users)) {
    return res.render("login", templateVars);
  }
  res.redirect("/urls");
});

//  handle shortURL redirects
app.get("/u/:id", (req, res) => {
  const templateVars = {
    user: {}
  };
  templateVars.user = users[req.session["user_id"]];
  if (Object.prototype.hasOwnProperty.call(urlDatabase, req.params.id)) {
    urlDatabase[req.params.id].numberOfUses += 1;
    res.redirect(urlDatabase[req.params.id].longURL);
  } else {
    templateVars.message = `Invalid shortCode: ${req.params.id}`;
    res.status(404).render("showMessage", templateVars);
  }
});

//  handle post requests

app.post("/urls", (req, res) => {
  const templateVars = {};
  templateVars.user = users[req.session["user_id"]];
  if (!isUserLoggedIn(req.session, users)) {
    templateVars.message = "Cannot create short URL. User is not logged in.";
    return res.render("showMessage", templateVars);
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
    numberOfUses: 0
  };
  urlDatabase[shortURL] = newLink;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const templateVars = {
    user: {}
  };
  templateVars.user = users[req.session["user_id"]];
  if (!shortURLCodeExists(req.params.id, urlDatabase)) { // another error
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

app.post("/urls/:id/update", (req, res) => {
  const templateVars = {
    user: {}
  };
  templateVars.user = users[req.session["user_id"]];
  if (!shortURLCodeExists(req.params.id, urlDatabase)) { // another error
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

app.post("/login", (req, res) => {
  const templateVars = {
    user: {}
  };
  if (!userIsRegistered({ email: req.body.email, password: req.body.password }, true, users)) {
    templateVars.message = "User and/or Password invalid.";
    return res.status(403).render("showMessage", templateVars);
  }
  if (req.body.email) {
    req.session["user_id"] = getUserIdFromCredentials(req.body.email, req.body.password, users);
  }
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const templateVars = {
    user: {}
  };

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

app.post("/logout", (req, res) => {
  req.session = null; // clear cookies.
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});