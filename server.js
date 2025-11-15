import express from 'express';
import ytdl from 'ytdl-core';
import puppeteer from 'puppeteer';

const app = express();

async function getLatestVideoId(username) {
  const channelUrl = `https://www.youtube.com/user/${username}/videos`;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.goto(channelUrl, { waitUntil: 'networkidle2' });

  // Wait for video links to load
  await page.waitForSelector('a#video-title');

  // Extract first video ID on the page
  const videoId = await page.evaluate(() => {
    const videoLink = document.querySelector('a#video-title');
    if (!videoLink) return null;
    const url = new URL(videoLink.href);
    return url.searchParams.get('v');
  });

  await browser.close();

  if (!videoId) throw new Error('Could not find latest video ID for username: ' + username);
  return videoId;
}

app.get('/latest-video', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'username query parameter is required' });

  try {
    const videoId = await getLatestVideoId(username);
    const videoUrl = 'https://www.youtube.com/watch?v=' + videoId;

    const info = await ytdl.getInfo(videoUrl);

    const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });

    if (!format || !format.url) {
      return res.status(404).json({ error: 'No downloadable format found' });
    }

    res.json({ videoId, downloadUrl: format.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
