import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Check API key availability
app.get('/api/ai/status', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ configured: hasKey });
});

// Endpoint 1: Generate a brand new high-quality question with AI
app.post('/api/ai/question', async (req, res) => {
  try {
    const { subject, category, difficulty, level = 'O Level' } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate a high-quality Multiple Choice Question (MCQ) for ${level} ${subject || 'Mathematics'}.
Category: ${category || 'General'}
Difficulty: ${difficulty || 'Medium'}

Requirements:
1. The question stem must be professionally written, suitable for academic exams, and can include LaTeX math formulas enclosed in \\( ... \\) for inline math and \\$\\$ ... \\$\\$ for block math if relevant.
2. Provide exactly four options (A, B, C, D) with distinct text. One option must be the correct answer.
3. Provide a detailed explanation justifying the correct answer and explaining why others are incorrect.

Return a JSON object conforming to the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite academic curriculum designer and private tutor expert. You craft mathematically and scientifically precise multiple choice questions with beautiful LaTeX notation and rich educational explanations.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['stem', 'options', 'correctOptionLabel', 'explanation'],
          properties: {
            stem: {
              type: Type.STRING,
              description: 'The main body of the question, supporting LaTeX math markup in \\( ... \\) or \\$\\$ ... \\$\\$',
            },
            options: {
              type: Type.ARRAY,
              description: 'Four MCQ options',
              items: {
                type: Type.OBJECT,
                required: ['label', 'text'],
                properties: {
                  label: { type: Type.STRING, description: 'One of: A, B, C, D' },
                  text: { type: Type.STRING, description: 'The display text of the option' },
                },
              },
            },
            correctOptionLabel: {
              type: Type.STRING,
              description: 'The correct option label (A, B, C, or D)',
            },
            explanation: {
              type: Type.STRING,
              description: 'Clear pedagogical rationale explaining step-by-step why the correct option is right.',
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini");
    }

    const data = JSON.parse(text.trim());
    res.json(data);
  } catch (error: any) {
    console.error("AI Question Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate question with AI" });
  }
});

// Endpoint 2: Generate distractors for a draft question stem and correct answer
app.post('/api/ai/distractors', async (req, res) => {
  try {
    const { stem, correctAnswer } = req.body;
    if (!stem || !correctAnswer) {
      return res.status(400).json({ error: "Missing question stem or correct answer." });
    }

    const ai = getGeminiClient();

    const prompt = `Given the question stem: "${stem}"
And the correct answer: "${correctAnswer}"

Generate exactly 3 highly plausible distractors (incorrect options) that represent common student misconceptions or calculation errors.
Return them as an array of objects.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert tutor creating plausible incorrect options (distractors) to gauge student misconceptions. Do not generate obviously false or silly choices.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['distractors'],
          properties: {
            distractors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['text', 'misconceptionRationale'],
                properties: {
                  text: { type: Type.STRING, description: 'The text of the distractor' },
                  misconceptionRationale: { type: Type.STRING, description: 'Explanation of what student misconception this option targets' },
                },
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini");
    }

    const data = JSON.parse(text.trim());
    res.json(data);
  } catch (error: any) {
    console.error("AI Distractor Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate distractors with AI" });
  }
});

// Endpoint 3: Generate detailed explanation for a given question and correct answer
app.post('/api/ai/explanation', async (req, res) => {
  try {
    const { stem, options, correctAnswer } = req.body;
    if (!stem || !correctAnswer) {
      return res.status(400).json({ error: "Missing question stem or correct answer." });
    }

    const ai = getGeminiClient();

    const prompt = `Write a detailed, beautiful, and step-by-step pedagogical explanation for this MCQ.
Question Stem: "${stem}"
Options: ${JSON.stringify(options || [])}
Correct Answer: "${correctAnswer}"

Make the explanation clear, readable, and highly educational, using step-by-step paragraphs.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite academic tutor. Write step-by-step pedagogical rationales for multiple choice questions, using inline LaTeX math formatting like \\( ... \\) when describing math operations or variables.',
      },
    });

    res.json({ explanation: response.text });
  } catch (error: any) {
    console.error("AI Explanation Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate explanation with AI" });
  }
});

// Setup Vite Dev Server / Static Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lumina MCQ Pro Server running on http://localhost:${PORT}`);
  });
}

startServer();
