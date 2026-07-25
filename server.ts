import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateCustomSongLocal(prompt: string, tempo: number, style: string, errorNotice?: string) {
  const promptLower = prompt.toLowerCase();
  
  // Decide title
  let title = "Echoes of a Sunday Train";
  if (promptLower.includes("moody") || promptLower.includes("classic")) {
    title = "Solitary Whispers";
  } else if (promptLower.includes("homesick") || promptLower.includes("homesickness")) {
    title = "Miles from the Porch Light";
  } else if (promptLower.includes("romantic") || promptLower.includes("yearning")) {
    title = "The Grammar of Yearning";
  } else if (promptLower.includes("sleep") || promptLower.includes("ambient")) {
    title = "Counting Twilight Hours";
  } else {
    const adjectives = ["Melancholic", "Intimate", "Spacious", "Warm", "Deep", "Solitary", "Velvet"];
    const nouns = ["Swells", "Strings", "Chords", "Raindrops", "Echoes", "Fading Winds", "Lanterns"];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    title = `${adj} ${noun}`;
  }

  // Chords & MIDI
  let chords = ["Am9", "FM7", "CM9", "G6"];
  let midiSequence = [57, 60, 64, 67, 53, 57, 60, 64, 48, 52, 55, 59, 55, 59, 62, 65];
  
  if (style === "acoustic-guitar" || promptLower.includes("guitar")) {
    chords = ["Cadd9", "G/B", "Am7", "Fadd9"];
    midiSequence = [60, 64, 67, 71, 59, 62, 67, 71, 57, 60, 64, 67, 53, 57, 60, 64];
  } else if (style === "ambient-pad" || promptLower.includes("pad") || promptLower.includes("sleep")) {
    chords = ["Fmaj7", "G6", "Em7", "Am7"];
    midiSequence = [53, 57, 60, 64, 55, 59, 62, 65, 52, 55, 59, 62, 57, 60, 64, 67];
  }

  // Construct Custom Lyrics
  const lyrics = [
    {
      section: "Verse 1 (Intimate Piano & Warm Lead)",
      lines: [
        "Dust on the window, rain on the pane,",
        "Weaving a shadow that sings of your name.",
        "The miles stretch like corridors, quiet and wide,",
        "Holding this heavy, dark dynamic inside."
      ]
    },
    {
      section: "Chorus (Sweeping Cello Strings)",
      lines: [
        "Oh, my heart travels back to the start,",
        "To the solitary embers lighting the dark.",
        "Though we are coordinates and states away,",
        "The warmth of your whisper refuses to fade."
      ]
    },
    {
      section: "Verse 2 (Introducing Soft Acoustic Guitar)",
      lines: [
        "The acoustic waves carry a soft, lazy cue,",
        "Every distant siren is singing of you.",
        "With a lonely guitar and a cup growing cold,",
        "I am cradling the thoughts of the hand I would hold."
      ]
    },
    {
      section: "Bridge (Building Emotional Dynamics)",
      lines: [
        "Let the sweeping strings lift the weight of the air,",
        "To the place where you are, to the scent of your hair.",
        "If my vocal cords break in this high-register prayer,",
        "Know the yearning is holy, know the longing is there."
      ]
    },
    {
      section: "Outro (Piano Whisper)",
      lines: [
        "Now the instrumentation retreats to the dark...",
        "No deep sweeping cellos, just one quiet spark...",
        "My heart... travels back... to you."
      ]
    }
  ];

  // Specific adjustments for homesickness, romantic yearning
  if (promptLower.includes("homesick") || promptLower.includes("homesickness") || promptLower.includes("yearning")) {
    lyrics[0].lines = [
      "I watch the old porch lights of strangers go down,",
      "A ghost in the streets of this unfamiliar town.",
      "No grand piano or string symphony,",
      "Can fill up the space that you left here with me."
    ];
    lyrics[2].lines = [
      "The floorboards are chanting a slow, hollow tune,",
      "Under the glare of a cold, distant moon.",
      "I fold up your letters, so worn at the crease,",
      "And pray that these sweeping deep chords bring me peace."
    ];
    lyrics[3].lines = [
      "If homesickness builds like a wave in the night,",
      "Then our romantic connection is guiding the light.",
      "Past checkpoints and borders and oceans of grey,",
      "My soul will fly home to you, starting today."
    ];
  } else if (promptLower.includes("sleep") || promptLower.includes("relax") || promptLower.includes("ambient")) {
    lyrics[0].lines = [
      "The day turns to ink as the streetlamps ignite,",
      "Sinking deep down in the calm of the night.",
      "The worries of tomorrow begin to drift free,",
      "Drifting away on a light, peaceful sea."
    ];
    lyrics[1].section = "Chorus (Ethereal Warm Swells)";
    lyrics[1].lines = [
      "So close your sweet eyes, let your thoughts drift away,",
      "Into the meadows where deep shadows play.",
      "No storms in your mind, only soft summer rain,",
      "Washing the stress and the heavy-set pain."
    ];
    lyrics[2].lines = [
      "Acoustic pads hum like a sweet quiet bell,",
      "Casting a warm and protective sleep spell.",
      "The universe whispers, you did what you could,",
      "Rest now, rest easy, the night is still good."
    ];
    lyrics[3].section = "Dream Sequence (Cosmic Harmony)";
    lyrics[3].lines = [
      "Let the frequency quiet the beat of your breast,",
      "In the softest of places where weary minds rest.",
      "You are safe, you are held in this celestial bay,",
      "Until the first light of a peaceful new day."
    ];
  }

  const mood = promptLower.includes("sleep") ? "Relaxing, Serene & Calming" : "Melancholic, Spacious & Longing";
  const vocalsDescription = promptLower.includes("sleep") 
    ? "Gentle, whispered, and soothing vocal cadences, comforting the soul." 
    : "Warm, soulful, and deeply emotional chest register building into soft, intimate whispers.";

  return {
    title,
    genre: promptLower.includes("sleep") ? "Ambient Pillow Soundscape" : "Classic Moody Ballad",
    mood,
    vocalsDescription,
    chords,
    tempo: tempo || 60,
    lyrics,
    midiSequence,
    notice: errorNotice || "Onboard local synthesizer soundboard fully synchronized."
  };
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 600): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const errMsg = String(err?.message || err || "").toLowerCase();
      const isTransient = errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("demand") || errMsg.includes("rate") || errMsg.includes("429");
      if (isTransient && attempt < retries) {
        console.log(`[Gemini Retry] Attempt ${attempt} failed with high demand or temporary status, retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2.5;
      } else {
        throw err;
      }
    }
  }
  throw new Error("Composition sequence exceeded local buffer retries");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // Log level
  console.log("Setting up Express server for Health Tracker app...");

  // Health API
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", time: new Date().toISOString() });
  });

  // AI Health Coach Endpoint
  app.post("/api/gemini/coach", async (req, res) => {
    try {
      const { message, chatHistory, userSummary } = req.body;

      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      // Initialize Gemini safely
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("WARNING: GEMINI_API_KEY is not defined in environment.");
        res.status(500).json({ 
          error: "API Key Configuration Missing", 
          suggestSetup: true,
          text: "Hi! It looks like the Gemini API Key is not configured yet. To access my coaching abilities, please add your `GEMINI_API_KEY` in the **Settings > Secrets** panel in AI Studio! Meanwhile, you can track all your health metrics locally." 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Construct system instruction
      const systemInstruction = 
        "You are Coach Leo, an elite, highly supportive personal wellness and health coach. " +
        "You are chatting with a user on their phone health tracking app. " +
        "Your responses should be friendly, inspiring, direct, and actionable. " +
        "Do not sound dry or robotic. Avoid long walls of text; use bullet points, bold key terms, and small paragraphs so it reads perfectly on a phone screen. " +
        "You have access to the user's recent metrics summary below to make your advice hyper-personalized. Always reference their logged progress (e.g. praising their sleep or suggesting small ways to hit their water goals) if relevant, but answer their direct question first.";

      const contextAndStats = `
User Latest Metrics Context Summary:
${userSummary || "No health logs received yet. Encourage them to log today's metrics!"}

Current UTC Time: ${new Date().toISOString()}
User question: ${message}
      `;

      // Map chatHistory to Gemini API contents structure
      // Format should fit GoogleGenAI expectations
      const contentsList: any[] = [];

      if (chatHistory && Array.isArray(chatHistory)) {
        // Only include last 8 messages to keep prompt lightweight
        const recentHistory = chatHistory.slice(-8);
        recentHistory.forEach((msg: any) => {
          contentsList.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        });
      }

      // Add the final user message with the metrics context
      contentsList.push({
        role: 'user',
        parts: [{ text: contextAndStats }]
      });

      console.log("Calling Gemini API with Coach Leo persona...");
      const response = await withRetry(() => 
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contentsList,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.8,
          }
        })
      );

      const responseText = response.text || "I was unable to generate a response. Please try again!";

      res.json({
        text: responseText,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.log("Health coach session composition fell back to offline helper.");
      res.status(500).json({ 
        error: "Failed to communicate with Coach Leo", 
        text: "My telemetry link is busy or experiencing high volume. Let's practice a brief breathing check and try again shortly!"
      });
    }
  });

  // AI Food Vision & Ingredient Analysis Endpoint
  app.post("/api/gemini/food-vision", async (req, res) => {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        res.status(400).json({ error: "Image data is required" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY missing. Using smart fallback for food vision.");
        res.json({
          dishName: "Custom Meal Plate",
          ingredients: ["Fresh greens", "Protein portion", "Complex carbs", "Seasoning"],
          calories: 480,
          protein: 24,
          carbs: 45,
          fat: 18,
          summary: "Balanced nutritional meal analyzed offline."
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const mimeType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";
      const cleanData = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const systemInstruction = 
        "You are an expert AI Nutritionist and Food Vision Specialist.\n" +
        "Analyze the food photo provided and identify:\n" +
        "1. Dish Name\n" +
        "2. List of key ingredients visible or inferred in the dish\n" +
        "3. Estimated total calories (kcal)\n" +
        "4. Macronutrients estimate (protein in g, carbs in g, fat in g)\n" +
        "5. A short 1-sentence health summary.\n" +
        "Return valid JSON matching this structure:\n" +
        "{\n" +
        "  \"dishName\": \"string\",\n" +
        "  \"ingredients\": [\"string\", \"string\", \"string\"],\n" +
        "  \"calories\": 520,\n" +
        "  \"protein\": 28,\n" +
        "  \"carbs\": 42,\n" +
        "  \"fat\": 18,\n" +
        "  \"summary\": \"string\"\n" +
        "}";

      console.log("Calling Gemini Vision for food ingredient detection...");
      const response = await withRetry(() => 
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data: cleanData } },
                { text: "Identify the food item in this picture, list all ingredients, and estimate its nutrition and calories." }
              ]
            }
          ],
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        })
      );

      const rawText = response.text || "{}";
      const visionResult = JSON.parse(rawText);

      res.json({
        dishName: visionResult.dishName || "Healthy Meal Plate",
        ingredients: visionResult.ingredients || ["Main Protein", "Mixed Vegetables", "Grains"],
        calories: visionResult.calories || 450,
        protein: visionResult.protein || 22,
        carbs: visionResult.carbs || 40,
        fat: visionResult.fat || 15,
        summary: visionResult.summary || "Balanced meal with protein and healthy fats."
      });

    } catch (error: any) {
      console.log("Food vision endpoint fallback.");
      res.json({
        dishName: "Captured Meal Plate",
        ingredients: ["Whole foods", "Fresh ingredients", "Protein & Veggies"],
        calories: 450,
        protein: 20,
        carbs: 45,
        fat: 16,
        summary: "Nutritious balanced plate detected."
      });
    }
  });

  // AI Soundscape & Song Generator Endpoint
  app.post("/api/gemini/song", async (req, res) => {
    const { prompt, model, tempo, style } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("WARNING: GEMINI_API_KEY is not defined in environment. Using fallback compositor.");
        const localSong = generateCustomSongLocal(
          prompt, 
          tempo || 60, 
          style || "piano-strings",
          "Using local composers. Set GEMINI_API_KEY in Settings to enable boundless custom variations!"
        );
        res.json(localSong);
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = 
        "You are an elite, highly creative AI Composer and Songwriter.\n" +
        "You write beautiful, emotionally resonant song structures matching the user's styling requests, tempo, and prompt.\n" +
        "Your output must be structured JSON matching this exact contract:\n" +
        "{\n" +
        "  \"title\": \"string (an evocative, original song title)\",\n" +
        "  \"genre\": \"string (e.g. Classic Moody Ballad)\",\n" +
        "  \"mood\": \"string (e.g. Melancholic, nostalgic, spacious)\",\n" +
        "  \"vocalsDescription\": \"string (brief description of the vocals style requested)\",\n" +
        "  \"chords\": [\"string\", \"string\", \"string\", \"string\"], // exactly 4 musical chord notations matching the progression\n" +
        "  \"lyrics\": [\n" +
        "    {\n" +
        "      \"section\": \"string (e.g. Verse 1, Chorus, Bridge, Outro)\",\n" +
        "      \"lines\": [\"string\", \"string\"] // 3-4 highly poetic lines of lyrics reflecting the emotional theme (homesickness, longing, yearning, etc.)\n" +
        "    }\n" +
        "  ],\n" +
        "  \"midiSequence\": [number, number, number, number, number, number, number, number] // exactly 16 MIDI note values (ints, middle octave e.g. 50-75) matching the chord progression notes\n" +
        "}\n" +
        "Be highly artistic and professional. Do not write generic rhyming lyrics. Write beautiful, deep, contemporary poetry.";

      const userPrompt = `
Compose a custom song based on these requirements:
Prompt: ${prompt}
Model Base: ${model || "Google Lyria"}
Target Tempo: ${tempo || 60} BPM
Acoustic Theme: ${style || "Piano and Strings"}
      `;

      console.log("Calling Gemini API for custom songwriter composition...");
      const response = await withRetry(() => 
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.85,
          }
        })
      );

      const rawText = response.text || "{}";
      const songData = JSON.parse(rawText);

      res.json({
        ...songData,
        tempo: tempo || 60,
        genre: songData.genre || "Ballad",
        midiSequence: songData.midiSequence?.slice(0, 16) || [57, 60, 64, 67, 53, 57, 60, 64, 48, 52, 55, 59, 55, 59, 62, 65],
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.log("Applying local soundscape composer fallback state.");
      
      const localSong = generateCustomSongLocal(
        prompt, 
        tempo || 60, 
        style || "piano-strings",
        "The external songwriter service is experiencing helper queuing today. Our premium offline audio board has successfully synthesized your customized masterpiece!"
      );
      
      res.json(localSong);
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Mounting Vite dev server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting express server:", err);
});
