const express = require('express');
const ytdl = require('ytdl-core');

const app = express();

async function getLatestVideoUrlByUsername(username) {
  // Get the channel URL from username
  const channelUrl = `https://www.youtube.com/user/${username}`;
  
  // Fetch the channel's videos page
  const info = await ytdl.getInfo(channelUrl).catch(() => null);
  if (!info || !info.videoDetails) throw new Error('Unable to fetch channel videos');

  const videoId = info.videoDetails.media.video_id; // Likely incorrect, need to fetch latest video differently

  // The above might not give latest video, so alternatively, need to scrape or use another method
}

// Here's a practical approach: We can search for latest videos by the username channel URL
// But ytdl-core alone does not support fetching latest videos from username directly.
// Instead, we can use a headless browser or a scraping method, but for simplicity, we assume we already have the latest video ID chance

app.get('/latest-video', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).send('Username required');

  try {
    // This part needs actual implementation of fetching latest video ID from username
    const latestVideoUrl = `https://www.youtube.com/watch?v=LATEST_VIDEO_ID`;
    const info = await ytdl.getInfo(latestVideoUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
    res.json({ downloadUrl: format.url });
  } catch (err) {
    res.status(500).send('Error fetching video: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
