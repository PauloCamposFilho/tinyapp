const { assert } = require("chai");
const bcrypt = require("bcryptjs");
const { getUserIdFromCredentials, userIsRegistered, shortURLCodeExists, getUrlsByUser, userOwnsUrl, generateRandomString, parseLongURL, isUserLoggedIn, getUserFromCookie, getUrlObj } = require("../helpers");

//test setup

const users = {
  a2b3c4: {
    id: "a2b3c4",
    email: "a@a.com",
    password: "$2a$10$p8p4vc92uWVYamR5NfCEp.8oD6w9xTj77SZKUgr6UVrMFy0vpG7oy", // abcd
  },
  bv12cd: {
    id: "bv12cd",
    email: "b@b.com",
    password: "4321",
  },
};
const theDate = new Date();
const urlDatabase = {
  "b2xVn2": {
    id: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userId: "a2b3c4",
    creationDate: theDate,
    numberOfUses: 0,
    uniqueVisitors: 0,
    visits: []
  },
  "9sm5xK": {
    id: "9sm5xK",
    longURL: "http://www.google.com",
    userId: "a2b3c4",
    creationDate: theDate,
    numberOfUses: 0,
    uniqueVisitors: 0,
    visits: []
  },
  "v9smk3": {
    id: "v9smk3",
    longURL: "http://www.yahoo.com",
    userId: "bv12cd",
    creationDate: theDate,
    numberOfUses: 0,
    uniqueVisitors: 0,
    visits: []
  },
  "vh8sdx": {
    id: "vh8sdx",
    longURL: "http://www.example.com",
    userId: "bv12cd",
    creationDate: theDate,
    numberOfUses: 0,
    uniqueVisitors: 0,
    visits: []
  }
};

const userOwnedURLs = {
  "b2xVn2": {
    userId: "a2b3c4",
    id: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    creationDate: theDate,
    numberOfUses: 0,
    uniqueVisitors: 0,
    visits: []
  },
  "9sm5xK": {
    userId: "a2b3c4",
    id: "9sm5xK",
    longURL: "http://www.google.com",
    creationDate: theDate,
    numberOfUses: 0,
    uniqueVisitors: 0,
    visits: []
  }
};

const getUrlTestObj = { 
  id: "b2xVn2",
  longURL: "http://www.lighthouselabs.ca",
  userId: "a2b3c4",
  creationDate: theDate,
  numberOfUses: 0,
  uniqueVisitors: 0,
  visits: []
};

// -----------------

describe("#shortURLCodeExists", () => {
  it("should return true if the shortURLCode is already present", () => {
    const shortURLExists = shortURLCodeExists("b2xVn2", urlDatabase);
    assert.isTrue(shortURLExists);
  });
  it("should return false if the shortURLCode does not exist", () => {
    const shortURLExists = shortURLCodeExists("idontexist", urlDatabase);
    assert.isFalse(shortURLExists);
  });
});

describe("#getUrlsByUser", () =>{
  it("should return an object with all owned urls", () => {
    const userURLs = getUrlsByUser({ id: "a2b3c4" }, urlDatabase);    
    assert.deepEqual(userURLs, userOwnedURLs);
  });
  it("should return an empty object if user doesnt own any urls", () => {
    const blankObj = {};
    const userURLs = getUrlsByUser({ id: "idontexist" }, urlDatabase);
    assert.deepEqual(userURLs, blankObj);
  });
});

describe("#userOwnsUrl", () => {
  it("should return true if given shortcode is owned by the userId", () => {
    const user = {
      id: "a2b3c4"
    };
    const shortURLCode = "b2xVn2"; // belongs to the user.
    assert.isTrue(userOwnsUrl(user, shortURLCode, urlDatabase));
  });
  it("should return false if the shortcode doesnt belong to userId", () => {
    const user = {
      id: "nottheowner"
    };
    const shortURLCode = "b2xVn2"; // doesnt belong.
    assert.isFalse(userOwnsUrl(user, shortURLCode, urlDatabase));
  });
  it("should also return false if the shortcode doesnt even exist, thus can never belong", () => {
    const user = {
      id: "a2b3c4" // a user that exists
    };
    const shortURLCode = "idontexist";
    assert.isFalse(userOwnsUrl(user, shortURLCode, urlDatabase));
  });
});

describe("#generateRandomString", () => {
  it("should return a string of the given length", () => {
    const string = generateRandomString(6); // test for 6.
    assert.equal(string.length, 6);
  });
  it("should be wholy alphanumeric", () => {
    const string = generateRandomString(6); // generate with 6.
    let stringRegex = new RegExp(/^[a-z0-9]+$/i);
    let result = stringRegex.test(string);
    assert.isTrue(result);
  });
});

describe("#parseLongUrl", () => {
  it("should return null if no string is passed into it", () => {
    const actualString = parseLongURL();
    assert.isNull(actualString);
  });
  it("should return null if something other than a string is passed into it", () => {
    const actualString = parseLongURL(1234);
    assert.isNull(actualString);
  });
  it("should correctly parse a URL that does not contain the protocol (http:// or http://) into one that does", () => {
    const testUrl = "www.idonthavetheprotocol.com";
    const actualString = parseLongURL(testUrl);
    const expectedString = "http://www.idonthavetheprotocol.com";
    assert.equal(actualString, expectedString);
  });
});

describe("#isUserLoggedIn", () => {
  it("should return true if user is logged in", () => {
    const cookieObj = {
      "user_id": "a2b3c4" // post decryption value.
    };
    assert.isTrue(isUserLoggedIn(cookieObj, users));
  });
  it("should return false if user is not logged in", () => {
    const cookieObj = {}; // obj would be empty if user is not logged in.
    assert.isFalse(isUserLoggedIn(cookieObj, users));
  });
});

describe("#getUserFromCookie", () => {
  it("should return a user object corresponding to the session cookie, if it exists", () => {
    const expectedUserObj = {
      id: "a2b3c4",
      email: "a@a.com",
      password: "$2a$10$p8p4vc92uWVYamR5NfCEp.8oD6w9xTj77SZKUgr6UVrMFy0vpG7oy", // abcd
    };
    const cookieValue = "a2b3c4"; //userId stored into the session cookie post-decryption.
    assert.deepEqual(getUserFromCookie(cookieValue, users), expectedUserObj);
  });
  it("should return null if the session cookie value is empty", () => {
    const cookieValue = "";
    assert.isNull(getUserFromCookie(cookieValue, users));
  });
  it("should return null if the cookie value does not match any user", () => {
    const cookieValue = "idontbelonganywhere";
    assert.isNull(getUserFromCookie(cookieValue));
  });
});

describe("#generatePassword", () => {
  it("should return a hashed password given a plain-text input", () => {
    const plainTextPassword = "abcd";
    const hashedPassword = bcrypt.hashSync(plainTextPassword, 10);
    assert.notEqual(hashedPassword, plainTextPassword);
  });
});

describe("#userIsRegistered", () => {
  it("should return the user object if a valid user object is passed (checkPassword = false)", () => {
    const userObj = {
      // id: "a2b3c4" not required
      email: "a@a.com"
      //password: "abcd" not required in this case
    };
    const expectedUserObj = {
      id: "a2b3c4",
      email: "a@a.com",
      password: '' // not relevant, function doesnt return it, but kept it in to match data structures.
    };
    assert.deepEqual(userIsRegistered(userObj, false, users), expectedUserObj);
  });
  it("should return the user object if a valid user object is passed (checkPassword = true)", () => {
    const userObj = {
      // id: "a2b3c4" not required
      email: "a@a.com",
      password: "abcd"
    };
    const expectedUserObj = {
      id: "a2b3c4",
      email: "a@a.com",
      password: '' // not relevant, function doesnt return it, but kept it in to match data structures.
    };
    assert.deepEqual(userIsRegistered(userObj, true, users), expectedUserObj);
  });
  it("should return undefined if non-existing email is given (checkPassword = false)", () => {
    const user = userIsRegistered({ email: "i@dont.exit" }, false, users);
    assert.isUndefined(user);
  });
  it("should return undefined if an existing email is given with the wrong password (checkPassword = true)", () => {
    const userObj = {
      // id: "a2b3c4" not required
      email: "a@a.com", // exists
      password: "notThePassword"
    };
    assert.isUndefined(userIsRegistered(userObj, true, users));
  });
});

describe("#getUserIdFromCredentials", () => {
  it("should return the correct userId when given correct credentials", () => {
    const userEmail = "a@a.com";
    const userPasswordPlainText = "abcd";
    const expectedID = "a2b3c4";
    assert.equal(getUserIdFromCredentials(userEmail, userPasswordPlainText, users), expectedID);
  });
  it("should return null if no userId can be retrieved with those credentials", () => {
    const userEmail = "d@d.com";
    const userPasswordPlainText = "efgh";
    assert.isNull(getUserIdFromCredentials(userEmail, userPasswordPlainText));
  });
});

describe("#getUrlObj", () => {
  it("should return an object with the information from the database if the code given exists", () => {
    assert.deepEqual(getUrlObj("b2xVn2", urlDatabase), getUrlTestObj);
  });
  it("should return null if the url doesnt exist.", () => {
    assert.isNull(getUrlObj("idontexist", urlDatabase));
  });
});