const bcrypt = require("bcryptjs");

const shortURLCodeExists = (shortURL, urlDatabase) => {
  return (Object.prototype.hasOwnProperty.call(urlDatabase, shortURL));
};

const getUrlsByUser = (user, urlDatabase) => {
  const returnObj = {};
  const userId = user.id;
  if (userId) {
    for (let shortURLCode in urlDatabase) {
      if (urlDatabase[shortURLCode].userId === userId) {
        returnObj[shortURLCode] = urlDatabase[shortURLCode].longURL;
      }
    }
  }
  return returnObj;
};

const userOwnsUrl = (user, shortURLCode, urlDatabase) => {
  const userId = user.id;
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

const isUserLoggedIn = (cookies, users) => {
  if (cookies["user_id"] && Object.prototype.hasOwnProperty.call(users, cookies["user_id"])) {
    return true;
  }
  return false;
};

const getUserFromCookie = (cookieValue, users) => {
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
      return true;
    }
  }
  return false;
};

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

module.exports = { shortURLCodeExists, getUrlsByUser, userOwnsUrl, generateRandomString, parseLongURL, isUserLoggedIn, getUserFromCookie, generatePassword, userIsRegistered, getUserIdFromCredentials };