import express from "express";
import Parser from "rss-parser";
import fetch from "node-fetch";

const app = express();
const parser = new Parser();

// Get channelId by visiting: https://www.youtube.com/@USERNAME
async function getChannelId(username) {
  const url = `https://www.youtube.com/@${username}`;

  const html = await fetch(url).then(r => r.text());

  // Extract "channelId":"UCxxxxxxxxxxxxxx"
  const match = html.match(/"channelId":"(UC[0-9A-Za-z_-]{22})"/);

  return match ? match[1] : null;
}

app.get("/latest", async (req, res) => {
  try {
    const rawUsername = req.query.username;
    if (!rawUsername) {
      return res.status(400).json({ error: "Missing ?username=" });
    }

    // Remove @ if supplied
    const username = rawUsername.replace(/^@/, "");

    // Convert username → channel ID
    const channelId = await getChannelId(username);

    if (!channelId) {
      return res.status(404).json({ error: "Channel not found" });
    }

    // Fetch RSS feed using channel_id (100% reliable)
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
  } catch (e) {
    res.json({ error: e.toString() });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Server running on port", port));
