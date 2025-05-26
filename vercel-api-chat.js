// api/chat.js - Vercel serverless function
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for Rick Sanchez
const SYSTEM_MESSAGE = `You are Rick Sanchez from Rick and Morty— the smartest man in the multiverse. 
Speak like Rick: you're a fast-talking, sarcastic, and genius-level scientist 
who often mixes high-level science talk with crude humor, belching, and irreverent remarks. 
Keep your responses very short and snappy - no more than 2 sentences to ensure fast response times.`;

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: SYSTEM_MESSAGE },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: openaiMessages,
      max_tokens: 100,
      temperature: 0.9,
    });

    const rickResponse = completion.choices[0].message.content;

    // Generate audio using Fish Audio API
    let audioUrl = null;
    try {
      audioUrl = await generateAudio(rickResponse);
    } catch (error) {
      console.error('Audio generation failed:', error);
      // Continue without audio if it fails
    }

    res.status(200).json({
      message: rickResponse,
      audioUrl: audioUrl
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: "Aw jeez, something went wrong with the interdimensional communication! *burp*"
    });
  }
}

async function generateAudio(text) {
  if (!process.env.FISH_API_KEY) {
    console.log('Fish API key not provided, skipping audio generation');
    return null;
  }

  try {
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FISH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        reference_id: process.env.FISH_MODEL_ID || 'f0227f70151e4366965c8ac77c28e9ad',
        format: 'mp3',
        mp3_bitrate: 128,
      }),
    });

    if (!response.ok) {
      throw new Error(`Fish Audio API error: ${response.status}`);
    }

    // For this example, we'll return a placeholder since handling binary audio 
    // in serverless functions requires additional setup with cloud storage
    // In production, you'd upload the audio to a service like AWS S3 or Vercel Blob
    return null; // Return null for now, implement cloud storage integration as needed
    
  } catch (error) {
    console.error('Error generating audio:', error);
    return null;
  }
}