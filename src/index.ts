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
import fetch from "node-fetch";

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function triggerGithubAction(jobId: string) {
  const repo = "Sandarva-9304/jett-deploy-service"; // 🔹 replace with your repo
  const workflow = "deploy.yml"; // 🔹 your workflow file
  const token = process.env.WORKER_TOKEN; // 🔹 PAT with "workflow" scope

  const url = `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ref: "main", // branch
      inputs: { job_id: jobId },
    }),
  });

  if (!res.ok) {
    console.error(await res.text());
    throw new Error("Failed to trigger GitHub Action");
  }
}

app.post("/deploy", async (req, res) => {
  const repoUrl = req.body.repoUrl;
  console.log(`Received request to deploy from repo: ${repoUrl}`);

  const id = generateId();

  await simpleGit().clone(repoUrl, path.join(__dirname, `./output/${id}`)); // Add your deployment logic here
  const allFiles = getAllFiles(path.join(__dirname, `./output/${id}`));

  allFiles.forEach(async (file) => {
    await uploadFile(
      file.slice(__dirname.length + 1).replaceAll("\\", "/"),
      file
    );
  });
  await new Promise((r) => setTimeout(r, 2000));

  // await publisher.lPush("build-queue", id);
  // publisher.hSet("status", id, "uploaded");

  await redis.hset("status", { [id]: "uploaded" });
  await triggerGithubAction(id);

  res.status(200).json({ id: id });
});

app.get("/status", async (req, res) => {
  const id = req.query.id;
  const url = `https://deploywithjett.onrender.com/${id}/`;
  const response = await redis.hget("status", id as string);
  res.json({
    status: response,
    url: response === "deployed" ? url : "",
  });
});

// app.listen(3000, () => {
//   console.log(`Server is running on http://localhost:3000`);
// });

app.listen(PORT as number, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
