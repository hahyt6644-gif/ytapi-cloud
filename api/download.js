import { Innertube } from "youtubei.js";

export default async function download(req, res) {
  try {
    const id = req.query.id;
    const quality = req.query.quality ? parseInt(req.query.quality) : null;

    if (!id)
      return res.status(400).json({ error: "Missing id" });

    const yt = await Innertube.create({
      client_type: "WEB_REMIX",
      enable_safety_mode: false,
      fetch: (...args) => fetch(...args)
    });

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
}
