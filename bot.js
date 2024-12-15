// Import the required libraries
const fetch = require('node-fetch'); // If you're running this on a local machine, ensure you install this dependency
require('dotenv').config();  // For loading environment variables from .env file

const subreddit = 'CucumberBotTestSub';  // The subreddit you're monitoring
const keyword = 'test';  // The keyword you're looking for in comments
const userAgent = 'reddit-bot v1.0';  // User-Agent to identify your bot

// Get credentials from environment variables (should be set as GitHub secrets or in a .env file for local development)
const clientId = process.env.REDDIT_CLIENT_ID;
const clientSecret = process.env.REDDIT_CLIENT_SECRET;
const username = process.env.REDDIT_USERNAME;
const password = process.env.REDDIT_PASSWORD;

// Function to get the Reddit access token using OAuth
async function getRedditToken() {
    const authUrl = 'https://www.reddit.com/api/v1/access_token';
    const authHeaders = new Headers();
    authHeaders.set('Authorization', 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'));
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('username', username);
    body.set('password', password);

    try {
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: authHeaders,
            body: body
        });

        if (!response.ok) {
            console.error('Failed to fetch access token:', response.statusText);
            return null;
        }

        const data = await response.json();
        console.log('Access Token received!');
        return data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error);
        return null;
    }
}

// Function to reply to a comment
async function replyToComment(commentId, token) {
    const replyUrl = `https://oauth.reddit.com/api/comment`;

    const body = new URLSearchParams();
    body.set('thing_id', `t1_${commentId}`);
    body.set('text', 'hello');  // The reply text

    try {
        const response = await fetch(replyUrl, {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${token}`,
                'User-Agent': userAgent,
            },
            body: body,
        });

        if (!response.ok) {
            console.error('Failed to post reply:', response.statusText);
            return;
        }

        console.log(`Replied to comment ${commentId}`);
    } catch (error) {
        console.error('Error posting reply:', error);
    }
}

// Function to monitor subreddit for comments
async function monitorSubreddit() {
    console.log('Bot is starting to monitor the subreddit...');

    const token = await getRedditToken();
    if (!token) {
        console.log('Failed to get Reddit token. Exiting.');
        return;
    }

    console.log('Access token received, starting to fetch comments...');
    const commentsUrl = `https://oauth.reddit.com/r/${subreddit}/comments/.json`;

    setInterval(async () => {
        console.log('Fetching latest comments from subreddit...');

        try {
            const response = await fetch(commentsUrl, {
                headers: {
                    'Authorization': `bearer ${token}`,
                    'User-Agent': userAgent,
                },
            });

            console.log(`Response status: ${response.status}`);

            if (response.status === 429) {
                console.log('Rate limit exceeded! Please try again later.');
                return;
            }

            const data = await response.json();
            console.log('Data received:', data);

            const comments = data[1]?.data?.children || [];
            console.log(`Found ${comments.length} new comments.`);

            if (comments.length === 0) {
                console.log('No new comments found.');
            }

            let matched = false;
            for (const post of comments) {
                const comment = post.data;
                console.log(`Checking comment ID: ${comment.id}, Content: ${comment.body}`);
                if (comment.body.includes(keyword)) {
                    console.log(`Found matching comment with ID: ${comment.id}`);
                    await replyToComment(comment.id, token);
                    matched = true;
                }
            }

            if (!matched) {
                console.log('No matching comments found.');
            }

        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }, 5000);  // Fetch every 5 seconds
}

// Start the bot
monitorSubreddit();
