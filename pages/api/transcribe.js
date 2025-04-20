import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use a more specific environment variable name
const DID_API_KEY = process.env.DID_API_KEY;
const DID_TALK_ENDPOINT = 'https://api.d-id.com/talks';

// Add API key validation
if (!DID_API_KEY) {
  console.error('D-ID API key is not configured');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  const data = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

  const { files } = data;
  const file = Array.isArray(files.audioFile) ? files.audioFile[0] : files.audioFile;

  if (!file?.filepath) {
    return res.status(400).json({ error: 'No audio file found' });
  }

  try {
    // Step 1: Transcribe
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: fs.createReadStream(file.filepath),
      response_format: 'json',
      language: 'ko'
    });

    // Step 2: Get feedback from GPT
    const feedback = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an attractive Korean language assistant. Your task is to help learners improve their Korean skills.' },
        { role: 'user', content: `User just learned basic greetings: "안녕하세요, 제 이름은 [name] 입니다, 반갑습니다." Please provide feedback on how well they performed. The user said: "${transcription.text}"` },
      ],
    });

    const feedbackText = feedback.choices[0].message.content;

    // Step 3: Generate TTS audio
    const speech = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx', // deep male voice
      input: feedbackText,
    });

    const buffer = Buffer.from(await speech.arrayBuffer());

    // Save the MP3 to /public
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    const mp3Path = path.join(publicDir, 'feedback.mp3');
    await fs.promises.writeFile(mp3Path, buffer);

    // Step 4: Upload MP3 to base64 for D-ID
    const audioBase64 = buffer.toString('base64');

    // Step 5: Generate video using D-ID
    if (!DID_API_KEY) {
      return res.status(200).json({
        transcription: transcription.text,
        feedback: feedbackText,
        audioUrl: '/feedback.mp3',
        videoUrl: null,
      });
    }

    try {
      const didResponse = await axios.post(DID_TALK_ENDPOINT, {
        source_url: "https://cdn.leonardo.ai/users/580e1d91-a559-4638-a922-6f5195bb0b8d/generations/e0a906fc-3c6f-456f-af7e-8cd573f11213/segments/1:4:1/Flux_Dev_ortrait_of_a_confident_Korean_male_Kdrama_character_o_0.jpg",
        script: {
          type: "audio",
          audio: audioBase64,
          provider: { type: "microsoft", voice_id: "ko-KR-InJoonNeural" }
        },
        config: {
          fluent: true,
          pad_audio: 0,
        }
      }, {
        headers: {
          'Authorization': `Bearer ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      const talkId = didResponse.data.id;

      // Step 6: Poll D-ID until video is ready
      let videoUrl = null;
      for (let i = 0; i < 20; i++) {
        const statusRes = await axios.get(`${DID_TALK_ENDPOINT}/${talkId}`, {
          headers: { 'Authorization': `Bearer ${DID_API_KEY}` }
        });

        if (statusRes.data.result_url) {
          videoUrl = statusRes.data.result_url;
          break;
        }
        await new Promise(r => setTimeout(r, 2000)); // wait 2s
      }

      // Cleanup uploaded temp file
      if (file?.filepath && fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }

      return res.status(200).json({
        transcription: transcription.text,
        feedback: feedbackText,
        audioUrl: '/feedback.mp3',
        videoUrl: videoUrl,
      });
    } catch (didError) {
      console.error('D-ID API Error:', didError.response?.data || didError.message);
      // Continue without video if D-ID fails
      return res.status(200).json({
        transcription: transcription.text,
        feedback: feedbackText,
        audioUrl: '/feedback.mp3',
        videoUrl: null,
        didError: didError.response?.data || didError.message
      });
    }

  } catch (error) {
    console.error('Error:', error);
    if (file?.filepath && fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }
    return res.status(500).json({
      error: 'Something went wrong',
      details: error.message
    });
  }
}
