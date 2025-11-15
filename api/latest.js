import { Innertube } from "youtubei.js";

export default async function latest(req, res) {
  try {
    const { username } = req.query;
    if (!username)
      return res.status(400).json({ error: "Missing username" });

    const yt = await Innertube.create({
      client_type: "WEB_REMIX",
      enable_safety_mode: false,
      fetch: (input, init) => fetch(input, init)
    });

    const channel = await yt.getChannel(`@${username}`);
    const video = channel.videos[0];
    const id = video.id;

    const info = await yt.getInfo(id);
    const formats = extractFormats(info.streaming_data);

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
