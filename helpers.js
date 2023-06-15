const shortURLCodeExists = (shortURL, urlDatabase) => {  
  return (Object.prototype.hasOwnProperty.call(urlDatabase, shortURL));
};

const getUrlsByUser = (user, urlDatabase) => {
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

const userOwnsUrl = (user, shortURLCode, urlDatabase) => {
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