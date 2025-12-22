import Groq from "groq-sdk";
import { getCollection } from "./chroma.js";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function embedQuery(query) {
  const emb = await groq.embeddings.create({
    model: "nomic-embed-text",
    input: query
  });
  return emb.data[0].embedding;
}

export async function answerQuestion(question) {
  const collection = await getCollection();

  const qEmbedding = await embedQuery(question);

  const results = await collection.query({
    queryEmbeddings: [qEmbedding],
    nResults: 3
  });

  const context = results.documents[0].join("\n");

  const prompt = `
Use the context below to answer the question.
If answer is not found, say "I don't know".

CONTEXT:
${context}

QUESTION:
${question}
`;

  const completion = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [{ role: "user", content: prompt }]
  });

  return completion.choices[0].message.content;
}
