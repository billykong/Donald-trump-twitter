const Twitter = require('twitter');

module.exports = function() {
  let client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_TOKEN_SECRET
  });

  function getLast200Tweets(tweets=[]) {
    let params = { 
      screen_name: 'realdonaldtrump', 
      count: 200,
      trim_user: true,
      tweet_mode: 'extended'
    }

    if (tweets.length > 0 ) { 
      params.max_id = tweets.pop().id_str 
    }
    
    client.get('statuses/user_timeline', params, function(error, olderTweets, response) {
      if (error) { 
        console.log(error); 
        return; 
      }
      if (olderTweets.length == 1) {
        writeTweetsToFile(tweets);
      } else {
        getLast200Tweets(tweets.concat(olderTweets));
      }
    });
  }

  function writeTweetsToFile(tweets, filepath='tmp/all-tweets.json') {
    const fs = require('fs');
    fs.writeFile(filepath, JSON.stringify(tweets), (err) => err && console.log(err) ); 
  }

  function saveToS3() {
 
  }

  getLast200Tweets();
}