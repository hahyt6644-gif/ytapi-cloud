import { Innertube } from "youtubei.js";

export default async function handler(req, res) {
  try {
    const username = req.query.username;

    if (!username)
      return res.status(400).json({ error: "Missing username" });

    const yt = await Innertube.create({ client_type: "WEB" });
    const channel = await yt.getChannel(`@${username}`);
    const latest = channel.videos[0];

    const videoId = latest.id;
    const info = await yt.getInfo(videoId);

    const formats = extractFormats(info.streaming_data);

    res.json({
      status: "success",
      channel: channel.metadata.title,
      video_id: videoId,
      title: latest.title.text,
      video_url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: latest.thumbnail[0].url,
      formats
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

function extractFormats(data = {}) {
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