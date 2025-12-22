import { ChromaClient } from "chromadb";

export const chroma = new ChromaClient();
export const collectionName = "rag_collection";

export async function getCollection() {
  try {
    return await chroma.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: null 
    });
  } catch (e) {
    console.error("Chroma error:", e);
  }
}
