import express from "express";
import { Innertube } from "youtubei.js";

const app = express();

// Create YouTube client ONCE globally
let yt;
async function initYT() {
  if (!yt) {
    yt = await Innertube.create({
      client_type: "WEB_REMIX",
      enable_safety_mode: false,
      fetch: (...args) => fetch(...args)
    });
    console.log("Innertube client initialized");
  }
}
initYT();

// Home route
app.get("/", (req, res) => {
  res.json({ status: "YT API running", endpoints: ["/latest", "/formats", "/download"] });
});

// Get latest video of channel
app.get("/latest", async (req, res) => {
  try {
    const username = req.query.username;
    if (!username)
      return res.status(400).json({ error: "Missing ?username=" });

    await initYT();
    const channel = await yt.getChannel(`@${username}`);
    const video = channel.videos[0];
    const id = video.id;

    const info = await yt.getInfo(id);
    const formats = extract(info.streaming_data);

    res.json({
      success: true,
      channel: channel.metadata.title,
      video_id: id,
      title: video.title.text,
      thumbnail: video.thumbnail[0].url,
      url: `https://www.youtube.com/watch?v=${id}`,
      formats
    });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get all formats of video
app.get("/formats", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id)
      return res.status(400).json({ error: "Missing ?id=" });

    await initYT();
    const info = await yt.getInfo(id);
    const list = [...info.streaming_data.formats, ...info.streaming_data.adaptive_formats];

    res.json({
      success: true,
      video_id: id,
      formats: list.map(f => ({
        quality: f.quality_label || null,
        url: f.url || null,
        height: f.height || null,
        mime: f.mime_type || null
      }))
    });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Download specific video quality
app.get("/download", async (req, res) => {
  try {
    const id = req.query.id;
    const quality = req.query.quality ? parseInt(req.query.quality) : null;

    if (!id)
      return res.status(400).json({ error: "Missing ?id=" });

    await initYT();
    const info = await yt.getInfo(id);
    const list = [...info.streaming_data.formats, ...info.streaming_data.adaptive_formats];

    const match = list
      .filter(f => f.height)
      .sort((a, b) => b.height - a.height)
      .find(f => !quality || f.height <= quality);

    if (!match)
      return res.status(404).json({ error: "No matching format" });

    res.json({
      success: true,
      id,
      served_quality: match.height,
      url: match.url
    });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

function extract(data = {}) {
  const out = { "360p": null, "480p": null, "720p": null, "audio": null };
  const list = [...(data.formats || []), ...(data.adaptive_formats || [])];

  for (const f of list) {
    if (f.height === 360) out["360p"] = f.url;
    if (f.height === 480) out["480p"] = f.url;
    if (f.height === 720) out["720p"] = f.url;
    if (!f.vcodec && f.acodec) out["audio"] = f.url;
  }
  return out;
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
