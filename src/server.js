import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import bodyParser from "body-parser";
import { ElevenLabsClient } from "elevenlabs";
dotenv.config();

const app = express();
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(bodyParser.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const elevenLabsClient = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

app.post("/ask", async (req, res) => {

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
          { 
            role: "system", 
            content: prompt 
          },
          {
            role: "user",
            content: question
          }
        ]
      });

      const answerText = response.choices[0].message.content; 
      console.log("Generated Answer:", answerText);

      const audioResponse = await elevenLabsClient.textToSpeech.convert(
        '8PfKHL4nZToWC3pbz9U9', //Rose
        {
          text: answerText,
          model_id: 'eleven_v3',
          output_format: 'mp3_44100_128',
          voice_settings: { 
            stability: 0.5
          }
        }
      );

      const chunks = [];
      for await (const chunk of audioResponse) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);

    res.json({ 
      answer: answerText,
      audio: audioBuffer.toString('base64')
    });
  } catch (error) {
    console.error("Error processing /ask request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log("Backend running on http://localhost:3000");
});
