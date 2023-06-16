const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "a2b3c4",
    creationDate: new Date(),
    numberOfUses: 0,
    uniqueVisitors: 0,
    visits: []
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "a2b3c4",
    creationDate: new Date(),
    numberOfUses: 0,
    uniqueVisitors: 0,
    visits: []
  },
  "v9smk3": {
    longURL: "http://www.yahoo.com",
    userId: "bv12cd",
    creationDate: new Date(),
    numberOfUses: 0,
    uniqueVisitors: 0,
    visits: []

  },
  "vh8sdx": {
    longURL: "http://www.example.com",
    userId: "bv12cd",
    creationDate: new Date(),
    numberOfUses: 0,
    uniqueVisitors: 0,
    visits: []
  }
};

const users = {           // These initial users are not really used anymore. Their passwords are plaintext (and will not work)
  a2b3c4: {               // and they are kept simply as a means to show the overall object structure and to own a
    id: "a2b3c4",         // couple of shortURLs each for permission test cases (attempting to delete/update) their shortURLs.
    email: "a@a.com",
    password: "1234",
  },
  bv12cd: {
    id: "bv12cd",
    email: "b@b.com",
    password: "4321",
  },
};

module.exports = { urlDatabase, users };