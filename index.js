const GetAllTweets = require('./lib/get-all-tweets');

exports.getAllTweets = (/* event, context, callback */) => {
	GetAllTweets();
};
