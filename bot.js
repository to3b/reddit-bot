// No need to install node-fetch anymore, the native fetch API works in GitHub Actions
const { default: fetch } = require('node-fetch');  // GitHub Actions environment will use built-in fetch

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const username = process.env.REDDIT_USERNAME;
const password = process.env.REDDIT_PASSWORD;
const userAgent = 'myBot/1.0';
const keyword = 'test';  // The keyword to look for
const responseMessage = 'This is an automated response from the bot!';  // The message to reply with
const subreddit = 'CucumberBotTestSub';  // Replace with your desired subreddit

const authUrl = 'https://www.reddit.com/api/v1/access_token';

// Get Reddit access token
async function getRedditToken() {
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'User-Agent': userAgent,
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: username,
      password: password,
    }),
  });

  const data = await response.json();
  return data.access_token;
}

// Monitor subreddit for comments containing the keyword
async function monitorSubreddit() {
  const token = await getRedditToken();
  const commentsUrl = `https://oauth.reddit.com/r/${subreddit}/comments/.json`;

  setInterval(async () => {
    const response = await fetch(commentsUrl, {
      headers: {
        'Authorization': `bearer ${token}`,
        'User-Agent': userAgent,
      },
    });

    const data = await response.json();
    const comments = data[1]?.data?.children || [];

    for (const post of comments) {
      const comment = post.data;
      if (comment.body.includes(keyword)) {
        await replyToComment(comment.id, token);
      }
    }
  }, 5000);  // Check every 5 seconds
}

// Function to reply to the comment
async function replyToComment(commentId, token) {
  const replyUrl = `https://oauth.reddit.com/api/comment`;

  const response = await fetch(replyUrl, {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${token}`,
      'User-Agent': userAgent,
    },
    body: new URLSearchParams({
      'thing_id': `t1_${commentId}`,
      'text': responseMessage,
    }),
  });

  const data = await response.json();
  console.log(`Replied to comment ${commentId}`);
}

// Start the bot
monitorSubreddit();
