import express from "express";
import Parser from "rss-parser";
import fetch from "node-fetch";

const app = express();
const parser = new Parser();

// Extract channelId from @username
async function getChannelId(username) {
  const url = `https://www.youtube.com/@${username.replace(/^@/, "")}`;
  const html = await fetch(url).then(r => r.text());
  const match = html.match(/"channelId":"(UC[0-9A-Za-z_-]{22})"/);
  return match ? match[1] : null;
}

app.get("/allvideos", async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) return res.json({ error: "Missing ?username=" });

    // Step 1: get channelId
    const channelId = await getChannelId(username);
    if (!channelId) return res.json({ error: "Channel not found" });

    // Step 2: fetch RSS feed
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feed = await parser.parseURL(feedUrl);

    // Step 3: extract all video URLs
    const videos = feed.items.map(item => {
      const videoId = item.id.replace("yt:video:", "");
      return {
        title: item.title,
        video_id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    });

    res.json({
      channel_id: channelId,
      total_videos_found: videos.length,
      videos
    });

  } catch (e) {
    res.json({ error: String(e) });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Server running on port", port));
