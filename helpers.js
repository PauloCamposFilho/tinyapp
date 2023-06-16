const bcrypt = require("bcryptjs");

// returns true | false on whether a given shortURL exists.
const shortURLCodeExists = (shortURL, urlDatabase) => {
  return (Object.prototype.hasOwnProperty.call(urlDatabase, shortURL));
};

// returns an object with the url data of the shortcodes that belong to the user.
const getUrlsByUser = (user, urlDatabase) => {
  const returnObj = {};
  const userId = user.id;
  if (userId) {
    for (let shortURLCode in urlDatabase) {
      if (urlDatabase[shortURLCode].userId === userId) {
        returnObj[shortURLCode] = urlDatabase[shortURLCode];
      }
    }
  }
  return returnObj;
};

// returns an obj containing the url data from the dabatase.
const getUrlObj = (shortURLCode, urlDatabase) => {
  let objReturn = {};
  if (!shortURLCodeExists(shortURLCode, urlDatabase)) {
    return null;
  }
  objReturn = urlDatabase[shortURLCode];
  return objReturn;
};

// returns true | false on whether a given shortURL is owned by the user. Permission-related.
const userOwnsUrl = (user, shortURLCode, urlDatabase) => {
  const userId = user.id;
  if (Array.prototype.hasOwnProperty.call(urlDatabase, shortURLCode)) {
    if (urlDatabase[shortURLCode].userId === userId) {
      return true;
    }
  }
  return false;
};

// helper function that returns random alphanumeric string of a given length.
const generateRandomString = (length) => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';

  for (let i = 0; i < length; i++) {
    let randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
};

// helper function to ensure that given URLs are saved with protocol in case user did not provide it.
const parseLongURL = (longURL) => {
  if (!longURL || typeof longURL !== 'string') {
    return null;
  }
  let result = longURL.toLowerCase();
  if (!result.startsWith("http://") && !result.startsWith("https://")) {
    result = "http://" + result;
  }
  return result;
};

// checks the session cookie against the database to ensure that the user is logged on. Permission-related
const isUserLoggedIn = (cookies, users) => {
  if (cookies["user_id"] && Object.prototype.hasOwnProperty.call(users, cookies["user_id"])) {
    return true;
  }
  return false;
};

// returns a hashed password with a Salt of 10.
const generatePassword = (userPassword) => {
  return bcrypt.hashSync(userPassword, 10);
};

// returns a user object if the user is registered/exists in the database.
// checkPassword -- pass "true" if needs to check both user and password exist/match, "false" will otherwise be a simple email lookup.
const userIsRegistered = (user, checkPassword, users) => {
  for (const userId in users) {
    const storedEmail = users[userId].email;
    const storedPassword = users[userId].password;
    if (checkPassword) {
      if (!bcrypt.compareSync(user.password, storedPassword)) { // if it doesnt match, not our user, move on.
        continue;
      }
    }
    if (user.email === storedEmail) {
      return { id: userId, email: storedEmail, password: '' };
    }
  }
  return;
};

// simplified lookup that will return just the userId given valid credentials. Deprecated, not in use.
const getUserIdFromCredentials = (email, password, users) => {
  for (const userId in users) {
    const storedEmail = users[userId].email;
    const storedPassword = users[userId].password;
    if (storedEmail === email && bcrypt.compareSync(password, storedPassword)) {
      return users[userId].id;
    }
  }
  return null;
};

// helper function that returns a user object from a given session cookie. Deprecated, not in use.
const getUserFromCookie = (cookieValue, users) => {
  for (const userKey in users) {
    if (users[userKey].id === cookieValue) {
      return users[userKey];
    }
  }
  return null;
};

module.exports = { shortURLCodeExists, getUrlsByUser, userOwnsUrl, generateRandomString, parseLongURL, isUserLoggedIn, getUserFromCookie, generatePassword, userIsRegistered, getUserIdFromCredentials, getUrlObj };