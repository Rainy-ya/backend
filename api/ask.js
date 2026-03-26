import Groq from "groq-sdk";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const elevenLabsClient = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS"); 
  res.setHeader("Access-Control-Allow-Headers", "Content-Type"); 
  if (req.method === "OPTIONS") 
     return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { question } = req.body;

    let prompt = `
      You are an AR AI assistant. Answer the user's question in 1-2 sentences (in Mongolian). Be conversational as possible.
      You can add expression markers in English:
      - [giggles] or [laughs] for smiling
      - [sad] for sadness  
      - [angry] for anger
      - [nod] for nodding head (use at start of sentence)
      - [shake] for shaking head (use at start of sentence)`;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "assistant", content: prompt },
        { role: "user", content: question }
      ],
        temperature: 0.7,
        max_completion_tokens: 500,
        top_p: 0.9,
        reasoning_effort: "medium",
        stream: false,
        stop: null
    });

    const answerText = response.choices[0].message.content;
    console.log("Generated Answer:", answerText);

    const audioResponse = await elevenLabsClient.textToSpeech.convert(
      "NhY0kyTmsKuEpHvDMngm", // Bella(Default) voice
      {
        text: answerText,
        modelId: "eleven_v3",
        output_format: "mp3_44100_128",
        voice_settings: { stability: 0.0 }
      }
    );

    const chunks = [];
    for await (const chunk of audioResponse) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    res.status(200).json({
      answer: answerText,
      audio: audioBuffer.toString("base64")
    });
  } catch (error) {
    console.error("Error processing /ask request:", error);
    res.status(500).json({ error: error.message });
  }
}
