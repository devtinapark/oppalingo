import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = formidable({
    multiples: false,
    keepExtensions: true, // Keep file extensions
  });

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

  // Add debug logging
  console.log('File details:', {
    filepath: file.filepath,
    originalFilename: file.originalFilename,
    mimetype: file.mimetype,
    size: file.size
  });

  try {
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: fs.createReadStream(file.filepath),
      response_format: 'json',
      language: 'ko' // Specify Korean language
    });

    // Clean up the temporary file
    fs.unlinkSync(file.filepath);

    const feedback = await openai.chat.completions.create({
      model: 'gpt-4',  // Or GPT-3.5 depending on your needs
      messages: [
        { role: 'system', content: 'You are an attractive Korean language assistant. Your task is to help learners improve their Korean skills.' },
        { role: 'user', content: `User just learned basic greetings: "안녕하세요, 제 이름은 [name] 입니다, 반갑습니다." Please provide feedback on how well they performed. The user said: "${transcription.text}"` },
      ],
    });

    return res.status(200).json({
      transcription: transcription.text,
      feedback: feedback.choices[0].message.content,  // The language feedback
    });
  } catch (error) {
    console.error('OpenAI transcription error:', error);
    // Clean up the temporary file even if there's an error
    if (file?.filepath && fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }
    return res.status(500).json({
      error: 'Transcription failed',
      details: error.message
    });
  }
}
