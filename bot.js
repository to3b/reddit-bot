// Import fetch using the ESM (ES Module) syntax
import fetch from 'node-fetch';

// Reddit API credentials from environment variables
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const username = process.env.REDDIT_USERNAME;
const password = process.env.REDDIT_PASSWORD;
const userAgent = process.env.USER_AGENT;
const subreddit = 'CucumberBotTestSub';
const keyword = 'test';
const responseMessage = 'hello';

// Get the Reddit OAuth token
async function getRedditToken() {
  const authUrl = 'https://www.reddit.com/api/v1/access_token';
  const authData = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
  });

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'User-Agent': userAgent,
    },
    body: authData,
  });

  const data = await response.json();
  return data.access_token;
}

// Monitor the subreddit and reply to comments
async function monitorSubreddit() {
  const token = await getRedditToken();

  // Fetch recent comments from the subreddit
  const url = `https://api.reddit.com/r/${subreddit}/comments?limit=10`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': userAgent,
    },
  });

  const comments = await response.json();

  // Check each comment for the keyword and reply
  for (const comment of comments) {
    if (comment.data.body.includes(keyword)) {
      const replyUrl = `https://api.reddit.com/api/comment`;

      const replyData = new URLSearchParams({
        text: responseMessage,
        thing_id: `t1_${comment.data.id}`,
      });

      const replyResponse = await fetch(replyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': userAgent,
        },
        body: replyData,
      });

      const replyResult = await replyResponse.json();
      console.log('Replied:', replyResult);
    }
  }
}

// Start monitoring the subreddit every minute
setInterval(monitorSubreddit, 60000); // every 60 seconds
