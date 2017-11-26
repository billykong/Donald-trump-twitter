### Edit twitter api tokens/secrets in console
https://apps.twitter.com

### Twitter API Reference
https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-user_timeline.html

### On git-subtree
https://www.atlassian.com/blog/git/alternatives-to-git-submodule-git-subtree


Need to decide storage scheme:
1. use tweet_id range for filenames
2. how to store new tweets? -> just store as a new file
3. another lambda to group tweets into 200 tweets, or more, per file 