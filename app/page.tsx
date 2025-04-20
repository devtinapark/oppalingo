"use client";

import { useState } from "react";
import axios from "axios";
import { isAxiosError } from "axios";

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
  const AUTHORIZATION = `Bearer ${API_KEY}`;

  const HEADERS = {
    accept: "application/json",
    "content-type": "application/json",
    authorization: AUTHORIZATION,
  };

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
    console.error("Error generating image:", error.response?.data || error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
  }

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
    console.error("Error fetching image:", error.response?.data || error.message);
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
          onClick={() => setTab("setup")}
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
                  </div>
                  <div className="flex gap-4 mb-4">
                    <button
                      className="px-6 py-3 mt-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 bg-[#58CC02] text-white shadow-[0_4px_0_#58A700]"
                      onClick={generateAvatar}
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

      {tab === "lessons" && selectedLesson && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-lg border-2 border-[#E5E5E5]">
          <button
            onClick={() => setSelectedLesson(null)}
            className="mb-6 text-[#58CC02] font-bold hover:underline"
          >
            ← Back to Lessons
          </button>

          {lessons
            .filter((l) => l.id === selectedLesson)
            .map((lesson) => (
              <div key={lesson.id}>
                <h2 className="text-xl font-bold mb-2">{lesson.title}</h2>
                <div className="mt-6 mb-4">
                  <iframe
                    width="560"
                    height="315"
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

                <div className="mt-4">
                  <h3 className="font-semibold mb-2">
                    Practice with{" "}
                    {avatarName ||
                      `Your ${gender === "male" ? "Oppa" : "Noona"} TA`}
                  </h3>
                  <div className="bg-gray-50 border rounded p-3">
                    <p className="italic"></p>
                    <img
                      src="https://cdn.leonardo.ai/users/580e1d91-a559-4638-a922-6f5195bb0b8d/generations/e0a906fc-3c6f-456f-af7e-8cd573f11213/segments/1:4:1/Flux_Dev_ortrait_of_a_confident_Korean_male_Kdrama_character_o_0.jpg"
                      alt="Generated Avatar"
                      className="rounded-xl border shadow-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
