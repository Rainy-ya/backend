import fs from "fs";
import Groq from "@groq/sdk";
import { getCollection } from "./chroma.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function embedText(text) {
  const emb = await groq.embeddings.create({
    model: "nomic-embed-text",
    input: text
  });

  return emb.data[0].embedding;
}

async function run() {
  const collection = await getCollection();
  const docs = fs.readFileSync("./data/docs.txt", "utf8").split("\n\n");

  let ids = [];
  let embeddings = [];

  for (let i = 0; i < docs.length; i++) {
    const emb = await embedText(docs[i]);
    ids.push(`doc_${i}`);
    embeddings.push(emb);
  }

  await collection.add({
    ids,
    embeddings,
    documents: docs
  });

  console.log("Embedded and stored:", docs.length, "chunks");
}

run();
