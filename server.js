import express from "express";
import latest from "./api/latest.js";
import formats from "./api/formats.js";
import download from "./api/download.js";

const app = express();

app.get("/", (req, res) => {
  res.json({ status: "YT API running on Render" });
});

app.get("/api/latest", latest);
app.get("/api/formats", formats);
app.get("/api/download", download);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
