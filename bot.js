import fetch from 'node-fetch';
import qs from 'querystring';

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const userAgent = process.env.USER_AGENT;
const subreddit = 'CucumberBotTestSub';

async function getRedditToken() {
  const url = 'https://www.reddit.com/api/v1/access_token';

  const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const authOptions = {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'User-Agent': userAgent
    },
    body: qs.stringify({
      grant_type: 'client_credentials',
      scope: 'read submit comment' // Requesting read, submit, and comment permissions
    })
  };

  try {
    const response = await fetch(url, authOptions);
    const data = await response.json();
    
    if (data.access_token) {
      console.log('Access Token received:', data.access_token);
      return data.access_token;
    } else {
      console.error('Error getting access token:', data);
      return null;
    }
  } catch (err) {
    console.error('Error during token fetch:', err);
    return null;
  }
}

async function getComments(token) {
  const url = `https://www.reddit.com/r/${subreddit}/comments/.json`;
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': userAgent
    }
  };

  const response = await fetch(url, options);
  const data = await response.json();
  return data;
}

async function postReply(commentId, token) {
  const url = `https://www.reddit.com/api/comment`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': userAgent
    },
    body: qs.stringify({
      text: 'hello',
      parent: commentId
    })
  };

  const response = await fetch(url, options);
  const data = await response.json();
  console.log('Reply posted:', data);
}

async function monitorSubreddit() {
  const token = await getRedditToken();
  if (!token) return;

  const comments = await getComments(token);
  for (const post of comments[1].data.children) {
    const comment = post.data;
    if (comment.body.includes('test')) {
      console.log(`Found "test" in comment: ${comment.body}`);
      await postReply(comment.id, token);
    }
  }
}

setInterval(monitorSubreddit, 60000);  // Runs every minute
