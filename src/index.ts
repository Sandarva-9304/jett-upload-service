// f58be9f7340f4a6dd072b85c64301dcf;
// ef5163c8cb39fe002883b4c031e188a60d5821f4b38af3f0255d9102b9bf1413;
// https://851dfb4f4148a95b9c6ba0608e58ae01.r2.cloudflarestorage.com
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { simpleGit, SimpleGit } from "simple-git";
import { createClient } from "redis";
import { generateId } from "./generateid.js";
import { getAllFiles } from "./file.js";
import { uploadFile } from "./aws.js";

const __filename = fileURLToPath(import.meta.url);
// console.log(__filename);
const __dirname = path.dirname(__filename);
// console.log(__dirname);

const publisher = createClient();
publisher.connect();

const subscriber = createClient();
subscriber.connect();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/deploy", async (req, res) => {
  const repoUrl = req.body.repoUrl;
  console.log(`Received request to deploy from repo: ${repoUrl}`);

  const id = generateId();

  await simpleGit().clone(repoUrl, path.join(__dirname, `./output/${id}`)); // Add your deployment logic here
  //   console.log(path.join(__dirname, `./output/${id}`));
  const allFiles = getAllFiles(path.join(__dirname, `./output/${id}`));
  // console.log(allFiles);
  allFiles.forEach(async (file) => {
    await uploadFile(
      file.slice(__dirname.length + 1).replaceAll("\\", "/"),
      file
    );
  });
  await new Promise((r) => setTimeout(r, 5000));

  await publisher.lPush("build-queue", id);
  publisher.hSet("status", id, "uploaded");
  res.status(200).json({ id: id });
});

app.get("/status", async (req, res) => {
  const id = req.query.id;
  const response = await subscriber.hGet("status", id as string);
  res.json({
    status: response,
  });
});

app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000`);
});
