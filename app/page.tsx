"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { isAxiosError } from "axios";
import dynamic from "next/dynamic";

export default function App() {
  const [tab, setTab] = useState("setup");
  const [userName, setUserName] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [avatarStyle, setAvatarStyle] = useState("");
  const [avatarAdjectives, setAvatarAdjectives] = useState("");
  const maleStyles = ["Gentle Oppa", "Confident CEO Oppa", "Flirty Idol Oppa"];
  const femaleStyles = [
    "Cute Tomboy Noona",
    "Elegant Smart Noona",
    "Bubbly Sexy Noona",
  ];
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  // const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generationPassword, setGenerationPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [recordings, setRecordings] = useState<string[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [feedbackAudioUrl, setFeedbackAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const steps = [
    {
      type: "video",
      media:
        "https://sqtnqbtdf2kpwctq.public.blob.vercel-storage.com/hello-D8D5L7FWrIRypqCGgivoGASaIapx3X.mp4",
      caption: "안녕하세요 (annyeonghaseyo)",
    },
    {
      type: "user-input",
      script: "안녕하세요 (annyeonghaseyo)",
    },
    {
      type: "video",
      media:
        "https://sqtnqbtdf2kpwctq.public.blob.vercel-storage.com/names-lhaSc3wWiRuccNBMlvr8Ob5LYmQQZq.mp4",
      caption:
        "이름이 뭐에요? 제 이름은 공유입니다. (ireumi mwo-eyo? je ireumeun Gong-yu-imnida.)",
    },
    {
      type: "user-input",
      script: `제 이름은 ${userName}입니다. (je ireumeun ${userName}-imnida)`,
    },
    {
      type: "video",
      media:
        "https://sqtnqbtdf2kpwctq.public.blob.vercel-storage.com/nice-IzWkVPHdc5kYvLmxP0VFmOeHLtktvq.mp4",
      caption: "반갑습니다 (bangapseumnida)",
    },
    {
      type: "user-input",
      script: "반갑습니다 (bangapseumnida)",
    },
    {
      type: "analysis",
    },
  ];

  const step = steps[currentStep];
  const GENERATION_PASSWORD = process.env.NEXT_PUBLIC_GENERATION_PASSWORD;
  const ReactMediaRecorder = dynamic(
    () => import("react-media-recorder").then((mod) => mod.ReactMediaRecorder),
    { ssr: false },
  );

  const lessons = [
    {
      id: "lesson1",
      title: "Basic Greetings",
      phrase: "안녕하세요, 저는 지민이에요",
      clipUrl: "https://www.youtube.com/embed/I3Bmj1nCIko",
    },
    {
      id: "lesson2",
      title: "Asking for Directions",
      phrase: "여기 어떻게 가나요?",
      clipUrl: "/kdrama2.gif",
    },
  ];

  const API_KEY = process.env.NEXT_PUBLIC_LEONARDO_API_KEY;
  const AUTHORIZATION = `Bearer ${API_KEY}`; // Fixed template literal syntax


  const HEADERS = {
    accept: "application/json",
    "content-type": "application/json",
    authorization: AUTHORIZATION,
  };

const handleClearRecordings = () => {
  setRecordings([]);
  setAudioBlob(null);
  setAudioUrl(null);
  console.log('Cleared recordings and audio preview.');
};

const handleTranscribe = async () => {
  // Collect blobs from the audio recording URLs (assuming you have the URLs)
  const blobParts = await Promise.all(
    recordings.map(async (url) => {
      const response = await fetch(url);
      return await response.blob();
    })
  );

  // Create a Blob from the collected parts
  const audioBlob = new Blob(blobParts, { type: 'audio/wav' });

  // Log the type and size of the blob (ensure it's correct)
  console.log('type', audioBlob.type); // should be audio/wav
  console.log('size', audioBlob.size); // should be > 0

  // Create FormData and append the audio file (Blob) to it
  const formData = new FormData();
  formData.append('audioFile', audioBlob, 'user_audio.wav'); // Correctly append the file

  // Optionally, log FormData entries for debugging
  for (let [key, value] of formData.entries()) {
    console.log('FormData entry:', key, value);
  }

  try {
    // Send the FormData via axios to your API endpoint
    const response = await axios.post('/api/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Make sure this header is set
      },
    });

    // Log the transcription result
    console.log('Transcription and audio result:', response.data);
 if (response.data?.audioUrl) {
    setFeedbackAudioUrl(response.data.audioUrl);
  }
  } catch (err) {
    // Handle error
    console.error('Transcription error:', err);
  }
};



  // const analyzeRecordings = async (recordings: string[]) => {
  //   console.log("Analyzing recordings:", recordings);
  //   // Simulate async operation
  //   return new Promise((resolve) => {
  //     setTimeout(() => {
  //       resolve("fake-analysis-result");
  //     }, 1000);
  //   });
  // };

  // const playAnalysisVideo = (result: any) => {
  //   console.log("Playing analysis video with result:", result);
  // };

  async function generateAvatar() {
    console.log(
      "saved avatarAdjectivesrompt",
      avatarAdjectives,
      gender,
      avatarName,
    );
    try {
      // Step 1: Send a request to generate an image
      let url = "https://cloud.leonardo.ai/api/rest/v1/generations";
      const formattedAdjectives = avatarAdjectives
        .split(",")
        .map((adj) => adj.trim())
        .join(", ");
      const avatarPrompt = `Portrait of a ${formattedAdjectives} Korean ${gender} K-drama character (oppa), front-facing, cinematic lighting, dreamy bokeh background, natural Korean features, symmetrical face, soft glow, ultra detailed anime-inspired style, pastel color palette, studio-quality avatar`;

      const payload = {
        height: 1024,
        modelId: "b2614463-296c-462a-9586-aafdb8f00e36", // Model ID for the chosen model
        prompt: avatarPrompt,
        width: 1024,
      };

      let response = await axios.post(url, payload, { headers: HEADERS });

      console.log("Generate an image request:", response.status);

      if (response.status !== 200) {
        throw new Error("Failed to create image generation request");
      }

      const generationId = response.data.sdGenerationJob.generationId;
      console.log("Generation ID:", generationId);
      setGenerationId(generationId);

      // Step 2: Wait before fetching the generated image
      url = `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`;

      console.log("Waiting for image generation to complete...");
      await new Promise((resolve) => setTimeout(resolve, 20000)); // Wait 20 seconds

      response = await axios.get(url, { headers: HEADERS });

      console.log("Get generated image response:", response.status);

      if (response.status !== 200) {
        throw new Error("Failed to fetch generated image details");
      }

      console.log("Generated Image Details:", response.data);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error(
          "Error generating image:",
          error.response?.data || error.message,
        );
      } else {
        console.error("Unknown error:", error);
      }
    }
  }

  const validateAndGenerate = () => {
  if (generationPassword !== process.env.NEXT_PUBLIC_GENERATION_PASSWORD) {
    setPasswordError("Incorrect password");
    return;
  }
  generateAvatar();
};

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',  // Explicitly set to webm format
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });  // Changed to webm
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordings([...recordings, url]);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  async function testFetchGeneratedImage() {
    const url = `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`;

    try {
      const response = await axios.get(url, { headers: HEADERS });

      if (response.status !== 200) {
        throw new Error("Failed to fetch generated image details");
      }

      console.log("Fetched image details:", response.data);

      const imageUrl = response.data.generations_by_pk.generated_images[0].url;
      setAvatarImageUrl(imageUrl);
      console.log("Fetched Image URL:", imageUrl);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error(
          "Error fetching image:",
          error.response?.data || error.message,
        );
      } else {
        console.error("Unknown error:", error);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF5EA] p-4">
      <div className="flex justify-center space-x-4 mb-8">
        <button
          className={`px-6 py-3 rounded-xl text-lg font-bold transition-all transform hover:scale-105
          ${tab === "setup" ? "bg-[#58CC02] text-white shadow-[0_4px_0_#58A700]" : "bg-white border-2 border-[#E5E5E5] shadow-[0_4px_0_#E5E5E5]"}`}
          onClick={() => {setTab("setup"); handleClearRecordings();}}
        >
          1. Avatar Setup
        </button>
        <button
          className={`px-6 py-3 rounded-xl text-lg font-bold transition-all transform hover:scale-105
          ${tab === "lessons" ? "bg-[#58CC02] text-white shadow-[0_4px_0_#58A700]" : "bg-white border-2 border-[#E5E5E5] shadow-[0_4px_0_#E5E5E5]"}`}
          onClick={() => setTab("lessons")}
        >
          2. Lessons
        </button>
      </div>

      {tab === "setup" && (
        <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg border-2 border-[#E5E5E5]">
          <h2 className="text-2xl font-bold mb-6 text-[#4B4B4B]">
            Create Your AI Teacher! 🎮
          </h2>

          {/* Your Name input */}
          <label className="block mb-2 font-bold text-[#4B4B4B]">
            Your Name:
          </label>
          <input
            className="w-full border-2 border-[#E5E5E5] rounded-xl p-3 mb-4 focus:border-[#58CC02] focus:outline-none"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />

          {/* Avatar Name input */}
          <label className="block mb-2 font-bold text-[#4B4B4B]">
            Avatar Name:
          </label>
          <input
            className="w-full border-2 border-[#E5E5E5] rounded-xl p-3 mb-4 focus:border-[#58CC02] focus:outline-none"
            value={avatarName}
            onChange={(e) => setAvatarName(e.target.value)}
          />

          {/* Gender buttons */}
          <label className="block mb-2 font-bold text-[#4B4B4B]">
            Avatar Gender:
          </label>
          <div className="flex gap-4 mb-4">
            <button
              className={`px-6 py-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                gender === "male"
                  ? "bg-blue-500 text-white border-blue-600"
                  : "border-[#E5E5E5] hover:border-blue-500"
              }`}
              onClick={() => {
                setGender("male");
                setAvatarStyle("");
              }}
            >
              Male
            </button>
            <button
              className={`px-6 py-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                gender === "female"
                  ? "bg-pink-500 text-white border-pink-600"
                  : "border-[#E5E5E5] hover:border-pink-500"
              }`}
              onClick={() => {
                setGender("female");
                setAvatarStyle("");
              }}
            >
              Female
            </button>
          </div>

          {gender && (
            <>
              <label className="block mb-2 font-bold text-[#4B4B4B]">
                Choose a Style:
              </label>
              <select
                className="w-full border-2 border-[#E5E5E5] rounded-xl p-3 mb-4 focus:border-[#58CC02] focus:outline-none"
                value={avatarStyle}
                onChange={(e) => setAvatarStyle(e.target.value)}
              >
                <option value="">-- Select a Style --</option>
                {(gender === "male" ? maleStyles : femaleStyles).map(
                  (style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ),
                )}
                <option value="custom">✨ Create my own (Premium)</option>
              </select>

              {avatarStyle === "custom" && (
                <>
                  <div className="mb-4">
                    <label className="block mb-2 font-bold text-[#4B4B4B]">
                      Describe your {gender === "male" ? "Oppa" : "Noona"} (3
                      adjectives, comma separated)
                    </label>
                    <input
                      placeholder="e.g. gentle, romantic, confident"
                      className="w-full border-2 border-[#E5E5E5] rounded-xl p-3 mb-4 focus:border-[#58CC02] focus:outline-none"
                      onChange={(e) => setAvatarAdjectives(e.target.value)}
                    />
                    <label className="block mb-2 font-bold text-[#4B4B4B]">
                      Password:
                    </label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      className="w-full border-2 border-[#E5E5E5] rounded-xl p-3 mb-1 focus:border-[#58CC02] focus:outline-none"
                      value={generationPassword}
                      onChange={(e) => {
                        setGenerationPassword(e.target.value);
                        setPasswordError("");
                      }}
                    />
                    {passwordError && (
                      <p className="text-red-500 text-sm mb-4">
                        {passwordError}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-4 mb-4">
                    <button
                      className="px-6 py-3 mt-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 bg-[#58CC02] text-white shadow-[0_4px_0_#58A700]"
                      onClick={validateAndGenerate}
                    >
                      Generate
                    </button>
                    <button
                      className="px-6 py-3 mt-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 bg-[#58CC02] text-white shadow-[0_4px_0_#58A700]"
                      onClick={testFetchGeneratedImage}
                    >
                      Fetch
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Avatar preview section */}
          <div className="mt-6">
            {((avatarStyle !== "custom" && avatarStyle !== "") ||
              (avatarImageUrl && avatarImageUrl.trim() !== "")) && (
              <>
                <p className="font-semibold mb-2">
                  Your AI {gender === "male" ? "Oppa" : "Noona"}:
                </p>
                <img
                  src={
                    avatarStyle === "Gentle Oppa"
                      ? "https://cdn.leonardo.ai/users/580e1d91-a559-4638-a922-6f5195bb0b8d/generations/5097d7a5-9dbf-4fbf-af05-c0b64ae86354/segments/3:4:1/Flux_Dev_Portrait_of_a_handsome_Korean_male_Kdrama_character_o_2.jpg"
                      : avatarStyle === "Confident CEO Oppa"
                        ? "https://cdn.leonardo.ai/users/580e1d91-a559-4638-a922-6f5195bb0b8d/generations/e0a906fc-3c6f-456f-af7e-8cd573f11213/segments/1:4:1/Flux_Dev_ortrait_of_a_confident_Korean_male_Kdrama_character_o_0.jpg"
                        : avatarStyle === "Flirty Idol Oppa"
                          ? "https://cdn.leonardo.ai/users/580e1d91-a559-4638-a922-6f5195bb0b8d/generations/f79bb15e-2fa2-4f66-b1fe-6f0e2f23a5ba/segments/1:4:1/Flux_Dev_Portrait_of_a_flirty_and_playful_expression_trendy_id_0.jpg"
                          : avatarStyle === "Cute Tomboy Noona"
                            ? "https://cdn.leonardo.ai/users/580e1d91-a559-4638-a922-6f5195bb0b8d/generations/d65cd744-ebb5-4eeb-804c-6950626e278b/segments/3:4:1/Flux_Dev_Portrait_of_a_a_bubbly_tomboy_noona_casual_streetwear_2.jpg"
                            : avatarStyle === "Elegant Smart Noona"
                              ? "https://cdn.leonardo.ai/users/580e1d91-a559-4638-a922-6f5195bb0b8d/generations/29993fe1-095b-453b-bd5b-22f619f746b1/segments/4:4:1/Flux_Dev_Portrait_of_a_an_elegant_and_graceful_soft_and_confid_3.jpg"
                              : avatarStyle === "Bubbly Sexy Noona"
                                ? "https://cdn.leonardo.ai/users/580e1d91-a559-4638-a922-6f5195bb0b8d/generations/da785446-f6f0-40a0-87f4-c7cb81e27695/segments/2:4:1/Flux_Dev_Portrait_of_a_a_sexy_and_bubbly_flirty_wink_or_playfu_1.jpg"
                                : avatarImageUrl && avatarImageUrl.trim() !== "" // Ensure the avatar image URL is not blank
                                  ? avatarImageUrl
                                  : "" // Fallback to empty string if no valid image URL is present
                  }
                  alt="Generated Avatar"
                  className="rounded-xl border shadow-lg"
                />
              </>
            )}
          </div>
        </div>
      )}

      {tab === "lessons" && !selectedLesson && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-[#4B4B4B] text-center">
            Pick a Lesson! 📚
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className={`py-8 bg-white p-4 rounded-2xl shadow-lg border-2 border-[#E5E5E5] relative
                  ${
                    index === 0
                      ? "cursor-pointer transition-all transform hover:scale-105 hover:shadow-xl"
                      : "opacity-80 cursor-not-allowed"
                  }`}
                onClick={() => index === 0 && setSelectedLesson(lesson.id)}
              >
                {index !== 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-10 rounded-2xl flex items-center justify-center">
                    <div className="bg-white/90 px-6 py-2 rounded-xl text-center">
                      <span className="text-4xl">🔒</span>
                      <p className="text-gray-600 font-medium mt-2">
                        Complete Lesson 1 to unlock
                      </p>
                    </div>
                  </div>
                )}
                <h3 className="font-bold text-lg text-[#4B4B4B]">
                  {lesson.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "lessons" && selectedLesson && !hasStarted && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-lg border-2 border-[#E5E5E5]">
          <button
            onClick={() => {setSelectedLesson(null); handleClearRecordings();}}
            className="mb-6 text-[#58CC02] font-bold hover:underline"
          >
            ← Back to Lessons
          </button>

          {lessons
            .filter((l) => l.id === selectedLesson)
            .map((lesson) => (
              <div key={lesson.id}>
                <h2 className="text-xl font-bold mb-2">{lesson.title}</h2>
                <div
                  className="relative mt-6 mb-4 w-full"
                  style={{ paddingTop: "56.25%" }}
                >
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src={lesson.clipUrl}
                    title="Lesson Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="mb-4">
                  <p className="text-gray-600">Phrase:</p>
                  <ul className="list-disc pl-5">
                    <li>
                      <p className="text-lg font-bold">안녕하세요.</p>
                      <p className="text-gray-400 text-sm">annyeonghaseyo</p>
                      <p className="text-gray-500 italic">
                        Translation: Hello.
                      </p>
                    </li>
                    <li>
                      <p className="text-lg font-bold">
                        제 이름은 {userName || "ㅇㅇ"}입니다.
                      </p>
                      <p className="text-gray-400 text-sm">
                        je ireumeun {userName || "OO"}-imnida
                      </p>
                      <p className="text-gray-500 italic">
                        Translation: My name is {userName || "OO"}.
                      </p>
                    </li>
                    <li>
                      <p className="text-lg font-bold">반갑습니다.</p>
                      <p className="text-gray-400 text-sm">bangapseumnida</p>
                      <p className="text-gray-500 italic">
                        Translation: Nice to meet you.
                      </p>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setHasStarted(true)}
                  className="w-full py-4 px-8 bg-[#58CC02] text-white text-xl font-bold rounded-2xl shadow-[0_4px_0_#58A700] transition-all transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <span>
                    Start Practice with Your{" "}
                    {gender === "male" ? "Oppa" : "Noona"}! 🎯
                  </span>
                </button>
                <div className="mt-4"></div>
              </div>
            ))}
        </div>
      )}
      {tab === "lessons" && selectedLesson && hasStarted && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-lg border-2 border-[#E5E5E5]">
          <button
            onClick={() => {
              setHasStarted(false);
              setCurrentStep(0);
              handleClearRecordings();
            }}
            className="mb-6 text-[#58CC02] font-bold hover:underline"
          >
            ← Back to Lesson 1
          </button>
          <div className="space-y-6">
            {step.type === "video" && (
              <>
                <video
                  src={step.media}
                  controls
                  className="w-full rounded-xl mb-2"
                />
                <p className="text-center text-lg font-medium">
                  {step.caption}
                </p>
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="w-full py-4 px-8 bg-[#58CC02] text-white text-xl font-bold rounded-2xl shadow-[0_4px_0_#58A700] transition-all transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <span>Continue 👉</span>
                </button>
              </>
            )}

            {step.type === "user-input" && (
              <>
                <img
                  src="https://cdn.leonardo.ai/users/580e1d91-a559-4638-a922-6f5195bb0b8d/generations/e0a906fc-3c6f-456f-af7e-8cd573f11213/segments/1:4:1/Flux_Dev_ortrait_of_a_confident_Korean_male_Kdrama_character_o_0.jpg"
                  alt="Generated Avatar"
                  className="rounded-xl border shadow-lg"
                />
                <p className="mb-2 text-center">Your turn! Say:</p>
                <p className="text-center font-semibold text-lg italic">
                  "{step.script}"
                </p>

                <div className="audio-recorder">
                  <div className="controls flex gap-4 justify-center mt-4">
                    <button
                      onClick={
                        isRecording ? handleStopRecording : handleStartRecording
                      }
                      className="px-6 py-3 rounded-xl text-lg font-bold transition-all transform hover:scale-105 bg-[#58CC02] text-white shadow-[0_4px_0_#58A700]"
                    >
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </button>
                  </div>

                  {audioUrl && (
                    <>
                      <div className="audio-preview mt-4">
                        <audio src={audioUrl} controls className="w-full" />
                      </div>
                      <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="w-full mt-4 py-4 px-8 bg-[#58CC02] text-white text-xl font-bold rounded-2xl shadow-[0_4px_0_#58A700] transition-all transform hover:scale-105 flex items-center justify-center gap-3"
                      >
                        <span>Next Step ✨</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {step.type === "analysis" && (
              <div className="text-center">
                <p className="text-lg mb-4">
                  Ready to check your pronunciation?
                </p>
                <button
                  className="w-full py-4 px-8 bg-[#58CC02] text-white text-xl font-bold rounded-2xl shadow-[0_4px_0_#58A700] transition-all transform hover:scale-105 flex items-center justify-center gap-3"
                  onClick={async () => {
                    await handleTranscribe();
                  }}
                >
                  <span>Check My Progress! 🎉</span>

                </button>
                <div className="flex flex-col items-center">

  {feedbackAudioUrl && (
    <audio controls className="mt-4">
      <source src={feedbackAudioUrl} type="audio/mp3" />
      Your browser does not support the audio element.
    </audio>
  )}
  <img
    src="https://cdn.leonardo.ai/users/580e1d91-a559-4638-a922-6f5195bb0b8d/generations/e0a906fc-3c6f-456f-af7e-8cd573f11213/segments/1:4:1/Flux_Dev_ortrait_of_a_confident_Korean_male_Kdrama_character_o_0.jpg"
    alt="Generated Avatar"
    className="rounded-xl border shadow-lg m-5"
  />

</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
