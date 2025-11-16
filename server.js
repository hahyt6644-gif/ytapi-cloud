import express from "express";
import Parser from "rss-parser";
import fetch from "node-fetch";

const app = express();
const parser = new Parser();

// GET YOUTUBE CHANNEL ID FROM @username
async function getChannelId(username) {
  const url = `https://www.youtube.com/@${username}`;

  const html = await fetch(url).then(r => r.text());

  // Extract channelId from HTML
  const match = html.match(/"channelId":"(.*?)"/);

  if (!match) return null;

  return match[1];
}

app.get("/latest", async (req, res) => {
  try {
    const username = req.query.username;

    if (!username) {
      return res.status(400).json({ error: "Missing ?username=" });
    }

    // Convert @username → ChannelID
    const channelId = await getChannelId(username);

    if (!channelId) {
      return res.status(404).json({ error: "Channel not found" });
    }

    // Fetch RSS feed
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feed = await parser.parseURL(feedUrl);

    if (!feed.items.length) {
      return res.json({ error: "No videos found" });
    }

    const latest = feed.items[0];
    const videoId = latest.id.replace("yt:video:", "");

    res.json({
      username,
      channel_id: channelId,
      title: latest.title,
      video_id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`
    });

  } catch (err) {
    res.json({ error: String(err) });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Server running on port", port));
