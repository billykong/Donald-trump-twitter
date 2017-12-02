exports.getAllTweets = (event, context, callback) => {
  const GetAllTweets = require('./lib/get-all-tweets');
  GetAllTweets();
};


// const GetAllTweets = require('./lib/get-all-tweets');
// GetAllTweets();