const { render } = require("ejs");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = (length) => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    let randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }  
  return result;
}

const parseLongURL = (longURL) => {
  let result = longURL.toLowerCase();
  if (result.indexOf("http://") === -1) {
    result = "http://" + result;
  }
  return result;
};


// engine specific settings
app.set("view engine", "ejs"); // define EJS as engine
app.use(express.urlencoded({ extended: true })); // make buffer readable.

app.get("/", (req, res) => {  
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {};
  if (req.params && req.params.id) {
    templateVars.id = req.params.id;
    templateVars.longURL = urlDatabase[templateVars.id];
    templateVars.username = req.cookies["username"];
  }  
  res.render("url_shows", templateVars);
});

//  handle shortURL redirects
app.get("/u/:id", (req, res) => {
  console.log("request made.");
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    console.log(`Sending them to: ${urlDatabase[req.params.id]}`);
    res.redirect(urlDatabase[req.params.id]);
  } else {
    console.log(`Sending them ...nowhere hopefully.`);
    res.statusCode = 404;
    res.send(`Invalid code: ${req.params.id}`);
  }
});

//  handle post requests

app.post("/urls", (req, res) => {
  // console.log(req.body);
  // console.log(req.body.longURL);
  if (req.body.longURL) {
    const shortURL = generateRandomString(6);
    urlDatabase[shortURL] = parseLongURL(req.body.longURL);
    res.redirect(`/urls/${shortURL}`);
  }  
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/");
});

app.post("/urls/:id/update", (req, res) => {
  if (req.body.longURL) {
    urlDatabase[req.params.id] = parseLongURL(req.body.longURL);
  }
  res.redirect("/");
});

app.post("/login", (req, res) => {
  if (req.body.username) {
    res.cookie("username", req.body.username);
  }
  res.redirect("/urls");
});


// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

