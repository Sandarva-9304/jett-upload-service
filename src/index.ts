import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { simpleGit, SimpleGit } from "simple-git";
// import { createClient } from "redis";        // for connecting to locally running redis
import { Redis } from "@upstash/redis";
import { generateId } from "./generateid.js";
import { getAllFiles } from "./file.js";
import { uploadFile } from "./aws.js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
// console.log(__filename);
const __dirname = path.dirname(__filename);
// console.log(__dirname);

// const publisher = createClient();
// publisher.connect();

// const subscriber = createClient();
// subscriber.connect();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// const publisher = redis;
// const subscriber = redis;

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
  await new Promise((r) => setTimeout(r, 2000));

  // await publisher.lPush("build-queue", id);
  // publisher.hSet("status", id, "uploaded");

  await redis.lpush("build-queue", id);
  await redis.hset("status", { [id]: "uploaded" });

  res.status(200).json({ id: id });
});

app.get("/status", async (req, res) => {
  const id = req.query.id;
  const url = `https://${id}.jett.app`;
  const response = await redis.hget("status", id as string);
  res.json({
    status: response,
    url: response === "deployed" ? url : null,
  });
});

// app.listen(3000, () => {
//   console.log(`Server is running on http://localhost:3000`);
// });

app.listen(7860, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:7860`);
});
