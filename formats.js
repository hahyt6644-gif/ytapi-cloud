import { Innertube } from "youtubei.js";

export default async function handler(req, res) {
  try {
    const id = req.query.id;

    if (!id)
      return res.status(400).json({ error: "Missing id" });

    const yt = await Innertube.create({ client_type: "WEB" });
    const info = await yt.getInfo(id);

    const formats = collect(info.streaming_data);

    res.json({
      status: "success",
      video_id: id,
      formats
    });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

function collect(data = {}) {
  const all = [...(data.formats || []), ...(data.adaptive_formats || [])];

  return all.map(f => ({
    itag: f.itag,
    url: f.url || null,
    height: f.height || null,
    mime: f.mime_type || null,
    vcodec: f.vcodec || null,
    acodec: f.acodec || null
  }));
}