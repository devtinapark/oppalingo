# OppaLingo

OppaLingo is an interactive language learning app designed to help users learn Korean through engaging conversations with K-drama-inspired AI avatars. Users can practice speaking and understanding Korean by interacting with AI-generated avatars and voices, making language learning fun and personalized.

## Features

- **Interactive Learning**: Choose from different avatars and practice conversational Korean with K-drama expressions.
- **Personalized Avatars**: Pick your favorite K-drama oppa (male) or noona (female) avatar to guide you through lessons.
- **AI Conversation Practice**: Converse with AI avatars, receiving responses in Korean, and improve your speaking skills.
- **Speech Recognition**: Record your responses and get feedback on pronunciation to help you improve.

## Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Node.js, Firebase
- **AI Integration**: ElevenLabs (voice synthesis) and Gru.ai (AI avatars)
- **Avatar Creation**: Leonardo.ai (K-drama-style avatars)

## How It Works

1. **Select Your Avatar**: Choose from a variety of avatars based on your preference (male oppa or female noona).
2. **Start a Lesson**: Watch a K-drama clip to learn new expressions and vocabulary.
3. **Practice Speaking**: Respond to the avatar using a scripted sentence and record your speech.
4. **Get Feedback**: Receive real-time feedback from the AI to improve your pronunciation.

## Installation

### Prerequisites

1. [Node.js](https://nodejs.org/) installed on your machine.
2. A Firebase project and ElevenLabs API key for integrating speech synthesis.

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/oppalingo.git
   cd oppalingo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Environment Variables:

- Create a .env.local file in the root directory of the project.
- Add your Firebase API key and ElevenLabs API key to the .env.local file:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

4. Run the Application: Once everything is set up, start the development server:

   ```bash
   npm run dev
   ```

## License

- This project is licensed under the MIT License - see the LICENSE file for details.
