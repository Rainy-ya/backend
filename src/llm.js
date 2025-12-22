import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateAnswer(prompt) {
    
  const completion = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [{ role: "user", content: prompt }]
  });

  return completion.choices[0].message.content;
}
