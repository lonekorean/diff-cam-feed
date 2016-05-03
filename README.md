# diff-cam-feed

Web app that uses motion detection to take a snapshot when something moves, then uploads the image to Twitter.

### Demo

Visit http://diffcam.com/ to see this in action.

### Notes

Powered by diff-cam-engine (https://github.com/lonekorean/diff-cam-engine).

To run: `npm install`, then `gulp` (or `gulp watch`), then `npm start`. Everything is built to `/dist`. If you're in dev, hit `http://localhost:3000` to run the web app.

In dev, you'll want to create a `.env` file in the root with the following contents (edit as appropriate):

```javascript
process.env.ENVIRONMENT = 'dev';
process.env.PORT = 3000; // do not set in prod (auto-assigned by Heroku)
process.env.SESSION_SECRET = 'your secret string';
process.env.TWITTER_CONSUMER_KEY = 'your twitter consumer key';
process.env.TWITTER_CONSUMER_SECRET = 'your twitter consumer secret';
```

Diff Cam Feed relies on a registered Twitter app. You can create one via [Twitter Application Management](https://apps.twitter.com/). The `TWITTER_CONSUMER_KEY` and `TWITTER_CONSUMER_SECRET` values above will be provided when you do so.

Images are not necessarily uploaded to the account used for registering the Twitter app. Rather, users will be prompted to sign in with their own twitter account, which is where the images will be uploaded.

This web app does require `https` to run in production. It will run fine under `http` on localhost, though.
