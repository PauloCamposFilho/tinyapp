const { render } = require("ejs");
const express = require("express");
// const cookieParser = require('cookie-parser');
const cookieSession = require("cookie-session");
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "a2b3c4"
   },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "a2b3c4"
   },
   "v9smk3": {
    longURL: "http://www.yahoo.com",
    userId: "bv12cd"
   },
   "vh8sdx": {
    longURL: "http://www.example.com",
    userId: "bv12cd"
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

// Internal Functions for the Server

const shortURLCodeExists = (shortURL) => {  
  return (Object.prototype.hasOwnProperty.call(urlDatabase, shortURL));
};

const getUrlsByUser = (user) => {
  const returnObj = {};
  const userId = user.id;  
  console.log("passed userId:", userId)
  if (userId) {
    for (let shortURLCode in urlDatabase) {      
      if (urlDatabase[shortURLCode].userId === userId) {
        returnObj[shortURLCode] = urlDatabase[shortURLCode].longURL;
      }
    }
  }  
  return returnObj;
};

const userOwnsUrl = (user, shortURLCode) => {
  const userId = user.id;  
  console.log("userId:", userId);
  console.log("shortCode:", shortURLCode);
  if (Array.prototype.hasOwnProperty.call(urlDatabase, shortURLCode)) {
    if (urlDatabase[shortURLCode].userId === userId) {
      return true;
    }    
  }
  return false;
};

const generateRandomString = (length) => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';

  for (let i = 0; i < length; i++) {
    let randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
};

const parseLongURL = (longURL) => {
  let result = longURL.toLowerCase();
  if (!result.startsWith("http://") && !result.startsWith("https://")) {
    result = "http://" + result;
  }
  return result;
};

const isUserLoggedIn = (cookies) => {
  if (cookies["user_id"] && Object.prototype.hasOwnProperty.call(users, cookies["user_id"])) {
    return true;
  }
  return false;
};

const getUserFromCookie = (cookieValue) => {
  for (const user in users) {
    if (user.id === cookieValue) {
      return user;
    }
  }
  return null;
};

const generatePassword = (userPassword) => {
  return bcrypt.hashSync(userPassword, 10);
};

// checkPassword -- pass true if needs to check both user and password exist/match, otherwise simple email lookup.
const userIsRegistered = (user, checkPassword) => {  
  for (const userId in users) {
    const storedEmail = users[userId].email;
    const storedPassword = users[userId].password;
    if (checkPassword) {
      if (!bcrypt.compareSync(user.password, storedPassword)) { // if it doesnt match, not our user, move on.
        continue;
      }
    }
    if (user.email === storedEmail) {
      return true;
    }
  }
  return false;
};

const getUserIdFromCredentials = (email, password) => {
  for (const userId in users) {
    const storedEmail = users[userId].email;
    const storedPassword = users[userId].password;
    if (storedEmail === email && bcrypt.compareSync(password, storedPassword)) {
      return users[userId].id;
    }
  }
  return null;
};

// ------------------------

// engine specific settings | MIDDLEWARE
app.set("view engine", "ejs"); // define EJS as engine
app.use(express.urlencoded({ extended: true })); // make buffer readable.
// app.use(cookieParser());
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ["someReallyWrongAndSuperSecretSecretForSure", "AndYetAnothersUpErDuPerSecretSecret", "AndWhatDoYouKnowItsYetAnotherSuPeRduperSecretForrealsSecret!"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours.
}));

// -----------------------

// Routing (GET)

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = { user: {} };
  if (!isUserLoggedIn(req.session)) {
    return res.redirect(401, "/login");
  }
  templateVars.user = users[req.session["user_id"]];
  templateVars.urls = getUrlsByUser(templateVars.user);
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: {}
  };
  if (!isUserLoggedIn(req.session)) {
    return res.redirect(401, "/login");
  }
  templateVars.user = users[req.session["user_id"]];
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: {}
  };  
  if (!isUserLoggedIn(req.session)) {
    return res.redirect(401, "/login");
  }
  templateVars.user = users[req.session["user_id"]];
  
  if (!shortURLCodeExists(req.params.id)) {
    templateVars.message = `Invalid ShortCode`;
    return res.status(400).render("showMessage", templateVars);  }

  if (!userOwnsUrl(templateVars.user, req.params.id)) {
    templateVars.message = `Access Denied. You do not have access to view/edit ${req.params.id}`
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
  if (!isUserLoggedIn(req.session)) {
    return res.render("user_register", templateVars);
  }
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: {}
  };
  if (!isUserLoggedIn(req.session)) {
    return res.render("login", templateVars);
  }
  res.redirect("/urls");
});

//  handle shortURL redirects
app.get("/u/:id", (req, res) => {
  const templateVars = {
    user: {}
  };

  if (Object.prototype.hasOwnProperty.call(urlDatabase, req.params.id)) {
    console.log(`Sending them to: ${urlDatabase[req.params.id].longURL}`);
    res.redirect(urlDatabase[req.params.id].longURL);
  } else {
    console.log(`Sending them ...nowhere hopefully.`);
    if (isUserLoggedIn(req.session)) {
      templateVars.user = users[req.session["user_id"]];
    }
    templateVars.message = `Invalid shortCode: ${req.params.id}`;
    res.status(404).render("showMessage", templateVars)    
  }
});

//  handle post requests

app.post("/urls", (req, res) => {
  const templateVars = {
    user: {}
  };
  if (!isUserLoggedIn(req.session)) {
    templateVars.message = "Cannot create short URL. User is not logged in.";
    return res.render("showMessage", templateVars);
  }
  templateVars.user = users[req.session["user_id"]];
  if (!req.body.longURL) {
    templateVars.message = "The URL cannot be empty.";
    return res.status(400).render("showMessage", templateVars);
  }
  const shortURL = generateRandomString(6);
  const newLink = {
    longURL: parseLongURL(req.body.longURL),
    userId: templateVars.user.id
  };    
  urlDatabase[shortURL] = newLink;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const templateVars = {
    user: {}
  };
  if (!isUserLoggedIn(req.session)) {
    templateVars.message = `Access Denied. You do not have access to delete ${req.params.id}`
    return res.render("showMessage", templateVars);
  }
  templateVars.user = users[req.session["user_id"]];
  console.log(":id/delete route, id:", req.params.id);  
  if (!shortURLCodeExists(req.params.id)) { // another error
    console.log("I shouldnt be here...");
    templateVars.message = `Invalid ShortCode`;
    return res.status(400).render("showMessage", templateVars);
  }
  if (!userOwnsUrl(templateVars.user, req.params.id)) { // different error
    templateVars.message = "Access denied."
    console.log("Access was denid.");
    console.log(templateVars);
    return res.status(401).render("showMessage", templateVars);
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  const templateVars = {
    user: {}
  };
  if (!isUserLoggedIn(req.session)) {
    templateVars.message = "Cannot update URL. User is not logged in.";
    return res.render("showMessage", templateVars);
  }
  templateVars.user = users[req.session["user_id"]];
  if (!shortURLCodeExists(req.params.id)) { // another error
    templateVars.message = `Invalid ShortCode`;
    return res.status(400).render("showMessage", templateVars);
  }
  if (!userOwnsUrl(templateVars.user, req.params.id)) { // different error
    templateVars.message = `Access Denied. You do not have access to delete ${req.params.id}`
    return res.render("showMessage", templateVars);    
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
  if (!userIsRegistered({ email: req.body.email, password: req.body.password }, true)) {
    templateVars.message = "User and/or Password invalid.";
    return res.status(401).render("showMessage", templateVars);
  }
  if (req.body.email) {
    //res.cookie("user_id", getUserIdFromCredentials(req.body.email, req.body.password));
    req.session["user_id"] = getUserIdFromCredentials(req.body.email, req.body.password);
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

  console.log(user);

  if (!user.email || !user.password) {
    templateVars.message = "Please make sure to input both an email AND password.";
    return res.status(400).render("showMessage", templateVars);
  }

  if (userIsRegistered(user, false)) {    
    templateVars.message = "User already registered. Please login instead or register new user.";        
    return res.status(400).render("showMessage", templateVars);
  }

  user.id = generateRandomString(6);
  user.password = generatePassword(user.password);
  users[user.id] = user;
  
  templateVars.user = user;
  //res.cookie("user_id", user.id);
  req.session["user_id"] = user.id;
  res.redirect("/urls");
  console.log(users);
});

app.post("/logout", (req, res) => {
  //res.clearCookie("user_id");
  req.session = null; // clear cookies.
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});