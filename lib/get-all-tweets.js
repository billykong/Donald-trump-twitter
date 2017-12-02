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
      count: 25, // dynamodb 25 writes/sec limit
      trim_user: true,
      tweet_mode: 'extended' //get full_text of tweets
    }

    if (tweets.length > 0 ) { 
      params.max_id = tweets.pop().id_str 
    }
    
    client.get('statuses/user_timeline', params, function(error, olderTweets, response) {
      if (error) { 
        console.log(error); 
        return error; 
      }

      if (olderTweets.length == 1) {
        console.log("tweets retrieved: ", tweets.length+olderTweets.length);
        return;
      } else {
        saveToDynamoDB(olderTweets);
        // wait 1 sec so not to exceed dynamodb write capacity
        setTimeout(function(){
            getLast200Tweets(tweets.concat(olderTweets));
        }, 1000);
      }
    });
  }

  function writeTweetsToFile(tweets, filepath='tmp/all-tweets.json') {
    const fs = require('fs');
    fs.writeFile(filepath, JSON.stringify(tweets), (err) => {
      if (err) {
        console.log(err);
        return err;
      }
    }); 
  }

  function saveToDynamoDB(tweets) {
    const AWS = require('aws-sdk');
    // AWS.config.update({
    //   region: "us-east-1",
    //   endpoint: "http://localhost:8000"
    // });
    AWS.config.update({
      region: "us-east-1"
    });

    let docClient = new AWS.DynamoDB.DocumentClient();
    for (i = 0; i < tweets.length; i++) {
      let params = {
        TableName: "donald-tweets",
        Item: {
          id_str: tweets[i].id_str,
          full_text: tweets[i].full_text,
          created_at: tweets[i].created_at,
          raw_tweet_obj: JSON.stringify(tweets[i])
        }
      };
      docClient.put(params, function(err, data) {
        if (err) {
          console.error("Unable to add tweet", JSON.stringify(params, null, 2), ". Error JSON:", JSON.stringify(err, null, 2));
        } else {
          // console.log("PutItem succeeded:", params.Item.id_str);
        }
      });
    };
  }

  getLast200Tweets();
}