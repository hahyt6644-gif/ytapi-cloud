import { Innertube } from "youtubei.js";

export default async function handler(req, res) {
  try {
    const videoId = req.query.id;
    const quality = req.query.quality ? parseInt(req.query.quality) : null;

    if (!videoId)
      return res.status(400).json({ error: "Missing id" });

    const yt = await Innertube.create({ client_type: "WEB" });
    const info = await yt.getInfo(videoId);

    const list = [...(info.streaming_data.formats || []), ...(info.streaming_data.adaptive_formats || [])];

    const combined = list.filter(f => f.vcodec && f.acodec && f.url);
    const videoOnly = list.filter(f => f.vcodec && !f.acodec && f.url);
    const audioOnly = list.filter(f => !f.vcodec && f.acodec && f.url);

    const pick = (arr, q) => {
      if (!arr.length) return null;
      if (!q)
        return arr.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
      const filtered = arr.filter(x => x.height <= q);
      return filtered.sort((a, b) => (b.height || 0) - (a.height || 0))[0] || null;
    };

    const comb = pick(combined, quality);

    if (comb)
      return res.json({ served: comb.height, url: comb.url });

    const v = pick(videoOnly, quality);
    const a = audioOnly.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

    if (v && a)
      return res.json({ video_url: v.url, audio_url: a.url });

    return res.status(404).json({ error: "No format found" });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
