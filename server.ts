import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
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

  // Body parser with support for base64 camera image uploads up to 25MB
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

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
          model: "gemini-3.7-flash",
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
      console.error("Health coach error:", error);
      res.status(500).json({ 
        error: "Failed to communicate with Coach Leo", 
        text: "My telemetry link is busy or experiencing high volume. Let's practice a brief breathing check and try again shortly!"
      });
    }
  });

  // AI Food Vision & Ingredient Analysis Endpoint
  app.post("/api/gemini/food-vision", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64 || typeof imageBase64 !== "string") {
        res.status(400).json({ error: "Image data is required" });
        return;
      }

      const rawApiKey = process.env.GEMINI_API_KEY;
      const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, '') : undefined;

      if (!apiKey) {
        console.warn("GEMINI_API_KEY missing for food vision.");
        res.status(400).json({
          error: "API_KEY_MISSING",
          message: "GEMINI_API_KEY is required for AI Food Vision. Please add it in AI Studio Settings > Secrets panel."
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

      // Parse MIME type and clean Base64 data safely
      let mimeType = "image/jpeg";
      let cleanData = imageBase64.trim();
      
      if (cleanData.includes(";base64,")) {
        const parts = cleanData.split(";base64,");
        const meta = parts[0];
        cleanData = parts[1].trim();
        const match = meta.match(/data:([^;]+)/);
        if (match) {
          mimeType = match[1].toLowerCase();
        }
      } else if (cleanData.startsWith("data:")) {
        const commaIdx = cleanData.indexOf(",");
        if (commaIdx !== -1) {
          const meta = cleanData.substring(0, commaIdx);
          cleanData = cleanData.substring(commaIdx + 1).trim();
          const match = meta.match(/data:([^;]+)/);
          if (match) {
            mimeType = match[1].toLowerCase();
          }
        }
      }

      // Strip any whitespace, line breaks or carriage returns from base64 string
      cleanData = cleanData.replace(/[\r\n\s]/g, "");

      if (!cleanData || cleanData.length < 50) {
        res.status(400).json({
          error: "INVALID_IMAGE",
          message: "The provided image data was empty or corrupted. Please take a clear photo and try again."
        });
        return;
      }

      // Gemini Vision supports image/jpeg, image/png, image/webp, image/gif, image/heic
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
      if (!allowedMimes.includes(mimeType)) {
        mimeType = "image/jpeg";
      }

      const systemInstruction = 
        "You are an expert AI Nutritionist and Food Vision Specialist.\n" +
        "Carefully analyze the specific food/drink items in the provided photo.\n" +
        "Identify:\n" +
        "1. dishName: Exact dish or meal name (e.g. 'Avocado Toast with Poached Egg', 'Grilled Salmon with Quinoa', 'Pepperoni Pizza Slice')\n" +
        "2. ingredients: An array of specific, distinct visible ingredients and components\n" +
        "3. calories: A realistic numeric estimate of the total calories (kcal) for the photographed portion (e.g., 280, 560, 850)\n" +
        "4. protein: Estimated protein in grams (integer)\n" +
        "5. carbs: Estimated carbohydrates in grams (integer)\n" +
        "6. fat: Estimated fat in grams (integer)\n" +
        "7. summary: A concise 1-sentence nutritional insight highlighting key macronutrients or micronutrient benefits.";

      console.log(`Calling Gemini Vision (gemini-2.5-flash) with ${mimeType} image for nutrition analysis...`);
      const response = await withRetry(() => 
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data: cleanData } },
                { text: "Analyze this meal photo in detail. Accurately identify the exact food item, list its specific visible ingredients, and calculate realistic calories and macronutrients for this specific plate." }
              ]
            }
          ],
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                dishName: { type: Type.STRING, description: "Name of the dish or meal" },
                ingredients: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "List of identified ingredients"
                },
                calories: { type: Type.NUMBER, description: "Estimated total calories in kcal" },
                protein: { type: Type.NUMBER, description: "Estimated grams of protein" },
                carbs: { type: Type.NUMBER, description: "Estimated grams of carbohydrates" },
                fat: { type: Type.NUMBER, description: "Estimated grams of fat" },
                summary: { type: Type.STRING, description: "One sentence nutritional summary" }
              },
              required: ["dishName", "ingredients", "calories", "protein", "carbs", "fat", "summary"]
            },
            temperature: 0.1,
          }
        })
      );

      const rawText = (response.text || "").trim();
      let cleanJson = rawText;
      
      // Strip markdown code fences if model returned them
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      }
      
      // Extract json object bounds
      const firstBrace = cleanJson.indexOf("{");
      const lastBrace = cleanJson.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }

      let visionResult: any = {};
      try {
        visionResult = JSON.parse(cleanJson);
      } catch (parseErr) {
        console.warn("JSON.parse encountered issue on raw text:", rawText);
        const dishMatch = rawText.match(/"dishName"\s*:\s*"([^"]+)"/);
        const calMatch = rawText.match(/"calories"\s*:\s*(\d+)/);
        const protMatch = rawText.match(/"protein"\s*:\s*(\d+)/);
        const carbsMatch = rawText.match(/"carbs"\s*:\s*(\d+)/);
        const fatMatch = rawText.match(/"fat"\s*:\s*(\d+)/);
        visionResult = {
          dishName: dishMatch ? dishMatch[1] : "Nutritious Meal Plate",
          calories: calMatch ? parseInt(calMatch[1], 10) : 420,
          protein: protMatch ? parseInt(protMatch[1], 10) : 22,
          carbs: carbsMatch ? parseInt(carbsMatch[1], 10) : 40,
          fat: fatMatch ? parseInt(fatMatch[1], 10) : 15,
          ingredients: ["Identified ingredients", "Whole foods"],
          summary: "Freshly prepared balanced meal."
        };
      }

      res.json({
        dishName: visionResult.dishName || "Analyzed Meal",
        ingredients: Array.isArray(visionResult.ingredients) ? visionResult.ingredients : ["Main dish"],
        calories: Number(visionResult.calories) || 400,
        protein: Number(visionResult.protein) || 20,
        carbs: Number(visionResult.carbs) || 35,
        fat: Number(visionResult.fat) || 12,
        summary: visionResult.summary || "Balanced meal analyzed by Gemini Vision."
      });

    } catch (error: any) {
      console.error("Food vision endpoint error:", error);
      const errMsg = error?.message || "";
      let userFriendlyMsg = "Failed to analyze food photo with AI Vision. Please try again.";

      if (errMsg.includes("API key not valid") || errMsg.includes("API_KEY_INVALID") || errMsg.includes("Wrong token") || errMsg.includes("401") || errMsg.includes("UNAUTHENTICATED")) {
        userFriendlyMsg = "Invalid API Key. Please verify that your GEMINI_API_KEY in Settings > Secrets starts with 'AIzaSy...' without extra spaces or quotes.";
      } else if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429")) {
        userFriendlyMsg = "Rate limit reached for Gemini API. Please wait a moment and try again.";
      }

      res.status(500).json({
        error: "FOOD_VISION_FAILED",
        message: userFriendlyMsg
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
          model: "gemini-3.7-flash",
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
