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

// Log environment variables (make sure they are being read correctly)
console.log('CLIENT_ID:', clientId);
console.log('CLIENT_SECRET:', clientSecret);
console.log('USER_AGENT:', userAgent);

// Get the Reddit OAuth token
async function getRedditToken() {
  const authUrl = 'https://www.reddit.com/api/v1/access_token';
  const authData = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
  });

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'User-Agent': userAgent,
      },
      body: authData,
    });

    // Log the raw response from Reddit
    const responseText = await response.text();
    console.log('Response from Reddit (Token Request):', responseText);

    if (!response.ok) {
      console.log(`Error: ${response.status}`);
      return null;
    }

    const data = JSON.parse(responseText);
    console.log('Access Token received:', data.access_token);
    return data.access_token;

  } catch (error) {
    console.log('Error fetching access token:', error);
    return null;
  }
}

// Monitor the subreddit and reply to comments
async function monitorSubreddit() {
  const token = await getRedditToken();

  if (!token) {
    console.log('Failed to obtain access token.');
    return;
  }

  const url = `https://api.reddit.com/r/${subreddit}/comments?limit=10`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': userAgent,
      },
    });

    const responseText = await response.text();
    console.log('Response from Reddit (Comments Request):', responseText);

    if (!response.ok) {
      console.log(`Error: ${response.status}`);
      return;
    }

    const comments = JSON.parse(responseText);
    console.log('Fetched Comments:', comments);

    // Process comments...
    for (const comment of comments.data.children) {
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
  } catch (error) {
    console.log('Error fetching subreddit data:', error);
  }
}

// Start monitoring the subreddit every minute
setInterval(monitorSubreddit, 60000); // every 60 seconds
