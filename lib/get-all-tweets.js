const Twitter = require('twitter');
const AWS = require('aws-sdk');

module.exports = function getAllTweets() {
	function saveToDynamoDB(tweets) {
		AWS.config.update({
			region: 'us-east-1',
		});

		const docClient = new AWS.DynamoDB.DocumentClient();
		tweets.forEach((tweet) => {
			const params = {
				TableName: 'donald-tweets',
				Item: {
					id_str: tweet.id_str,
					full_text: tweet.full_text,
					created_at: tweet.created_at,
					raw_tweet_obj: JSON.stringify(tweet),
				},
			};
			docClient.put(params, (err /* data */) => {
				if (err) {
					console.error(
						'Unable to add tweet',
						JSON.stringify(params, null, 2),
						'. Error JSON:',
						JSON.stringify(err, null, 2),
					);
				} else {
					// console.log("PutItem succeeded:", params.Item.id_str);
				}
			});
		});
	}

	const client = new Twitter({
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
		access_token_secret: process.env.TWITTER_TOKEN_SECRET,
	});

	function getLast200Tweets(tweets = []) {
		const params = {
			screen_name: 'realdonaldtrump',
			count: 25, // dynamodb 25 writes/sec limit
			trim_user: true,
			tweet_mode: 'extended', // get full_text of tweets
		};

		if (tweets.length > 0) {
			params.max_id = tweets.pop().id_str;
		}

		client.get('statuses/user_timeline', params, (error, olderTweets /* response */) => {
			let result;
			if (error) {
				console.log(error);
				result = error;
				return result;
			}

			if (olderTweets.length === 1) {
				console.log('tweets retrieved: ', tweets.length + olderTweets.length);
			} else {
				saveToDynamoDB(olderTweets);
				// wait 1 sec so not to exceed dynamodb write capacity
				setTimeout(() => {
					getLast200Tweets(tweets.concat(olderTweets));
				}, 1000);
			}
		});
	}
	getLast200Tweets();
};
