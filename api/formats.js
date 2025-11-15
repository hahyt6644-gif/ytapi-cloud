import { Innertube } from "youtubei.js";

export default async function formats(req, res) {
  try {
    const { id } = req.query;

    if (!id)
      return res.status(400).json({ error: "Missing id" });

    const yt = await Innertube.create({
      client_type: "WEB_REMIX",
      enable_safety_mode: false,
      fetch: (input, init) => fetch(input, init)
    });

    const info = await yt.getInfo(id);
    const list = [...info.streaming_data.formats, ...info.streaming_data.adaptive_formats];

    res.json({
      success: true,
      id,
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
}
