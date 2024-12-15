const fetch = require('node-fetch');  // Import node-fetch for HTTP requests

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const username = process.env.REDDIT_USERNAME;
const password = process.env.REDDIT_PASSWORD;
const userAgent = 'myBot/1.0';
const keyword = 'YOUR_KEYWORD';  // Replace with your keyword
const responseMessage = 'This is an automated response from the bot!';  // The reply message
const subreddit = 'CucumberBotTestSub';  // Replace with your subreddit

const authUrl = 'https://www.reddit.com/api/v1/access_token';

// Get Reddit access token
async function getRedditToken() {
  const formData = new URLSearchParams();
  formData.append('grant_type', 'password');
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(clientId + ':' + clientSecret).toString('base64')}`,
      'User-Agent': userAgent,
    },
    body: formData,
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

// Reply to a comment
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
