import { Innertube } from "youtubei.js";

export default async function download(req, res) {
  try {
    const { id, quality } = req.query;

    if (!id)
      return res.status(400).json({ error: "Missing id" });

    const q = quality ? parseInt(quality) : null;

    const yt = await Innertube.create({
      client_type: "WEB_REMIX",
      enable_safety_mode: false,
      fetch: (input, init) => fetch(input, init)
    });

    const info = await yt.getInfo(id);
    const list = [...info.streaming_data.formats, ...info.streaming_data.adaptive_formats];

    const selected = list
      .filter(f => f.height)
      .sort((a, b) => b.height - a.height)
      .find(f => !q || f.height <= q);

    if (!selected)
      return res.status(404).json({ error: "No format available" });

    res.json({
      success: true,
      id,
      served: selected.height,
      url: selected.url
    });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
