import Groq from "groq-sdk";
import { ElevenLabsClient } from "elevenlabs";

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
      You are an AR AI guide. Answer the user's question in 1-2 sentences (in Mongolian). Be conversational as possible.
      You can add expression markers in English:
      - [giggles] or [laughs] for smiling
      - [sad] for sadness  
      - [angry] for anger
      - [nod] for nodding head (use at start of sentence)
      - [shake] for shaking head (use at start of sentence)`;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: question }
      ]
    });

    const answerText = response.choices[0].message.content;
    console.log("Generated Answer:", answerText);

    const audioResponse = await elevenLabsClient.textToSpeech.convert(
      "8PfKHL4nZToWC3pbz9U9", // Rose voice
      {
        text: answerText,
        model_id: "eleven_v3",
        output_format: "mp3_44100_128",
        voice_settings: { stability: 0.5 }
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
    res.status(500).json({ error: "Internal Server Error" });
  }
}
