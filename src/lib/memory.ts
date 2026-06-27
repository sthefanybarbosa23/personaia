import { db } from '../db/index.ts';
import { memories, characters } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-memory',
        }
      }
    });
  }
  return aiInstance;
}

export async function getOrCreateMemory(userId: number, characterId: number) {
  try {
    const [memoryRec] = await db.select().from(memories)
      .where(
        and(
          eq(memories.userId, userId),
          eq(memories.characterId, characterId)
        )
      );

    if (memoryRec) {
      return memoryRec;
    }

    // Create default memory row if none exists
    const [newRec] = await db.insert(memories).values({
      userId,
      characterId,
      userMemory: 'None yet. The user has just initiated the conversation.',
      characterMemory: 'None yet. Our journey is just beginning.',
      conversationSummary: 'The conversation has just begun.',
      relationshipStatus: 'Stranger',
      relationshipScore: 10,
    }).returning();

    return newRec;
  } catch (err) {
    console.error('Error fetching or creating memory:', err);
    throw err;
  }
}

export async function updateLongTermMemory(
  userId: number,
  characterId: number,
  userMessage: string,
  botReply: string
) {
  try {
    const memoryRec = await getOrCreateMemory(userId, characterId);
    const [charRec] = await db.select().from(characters).where(eq(characters.id, characterId));
    if (!charRec) {
      console.warn('Character not found, skipping memory update');
      return;
    }

    const ai = getGeminiClient();

    const prompt = `You are an AI Memory & Relationship Analyzer. Your task is to analyze the latest exchange between a user and an AI character, and update the character's long-term memory and relationship tracking.

Details of Character:
- Name: ${charRec.name}
- Tagline: ${charRec.tagline}

Existing state:
- User Memory (known facts/preferences/name of the user): "${memoryRec.userMemory}"
- Character Memory (what the character recalls/notes about their shared journey or private thoughts): "${memoryRec.characterMemory}"
- Conversation Summary (narrative summary of previous turns): "${memoryRec.conversationSummary}"
- Relationship Status: "${memoryRec.relationshipStatus}"
- Current Relationship Score: ${memoryRec.relationshipScore} (ranges from 0 to 100)

Latest Exchange:
- User says: "${userMessage}"
- ${charRec.name} replies: "${botReply}"

Please analyze this latest turn and update the fields. Follow these constraints:
1. User Memory: Keep track of facts, name, preferences, or topics of interest mentioned by the user. Append new details and retain old ones unless corrected. Keep it highly concise (bullet points or a short paragraph).
2. Character Memory: Write down what the character should remember about what transpired, how they felt, or decisions made. Keep it highly concise.
3. Conversation Summary: Revise or append to the summary of the narrative/chat so far.
4. Relationship Score & Status:
   - Decide if this turn was positive, negative, or neutral/conversational.
   - Set relationshipScoreChange to a value between -10 and +10 (integer).
   - Compute the new relationshipScore = currentScore + relationshipScoreChange (clamped between 0 and 100).
   - Update the relationshipStatus based on the new score:
     * 0 to 15: Stranger (or Distrusted / Hostile if score is very low)
     * 16 to 40: Acquaintance
     * 41 to 70: Friend
     * 71 to 90: Close Friend / Ally
     * 91 to 100: Soulmate / Eternal Bond

You MUST respond with a raw JSON object matching this schema:
{
  "userMemory": string,
  "characterMemory": string,
  "conversationSummary": string,
  "relationshipStatus": string,
  "relationshipScoreChange": number
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            userMemory: { type: 'STRING' },
            characterMemory: { type: 'STRING' },
            conversationSummary: { type: 'STRING' },
            relationshipStatus: { type: 'STRING' },
            relationshipScoreChange: { type: 'INTEGER' }
          },
          required: ['userMemory', 'characterMemory', 'conversationSummary', 'relationshipStatus', 'relationshipScoreChange']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from memory update analyzer');
    }

    const data = JSON.parse(resultText);
    
    // Calculate new score clamped between 0 and 100
    const change = Number(data.relationshipScoreChange) || 0;
    let newScore = (memoryRec.relationshipScore || 10) + change;
    if (newScore < 0) newScore = 0;
    if (newScore > 100) newScore = 100;

    // Save to DB
    await db.update(memories).set({
      userMemory: data.userMemory || memoryRec.userMemory,
      characterMemory: data.characterMemory || memoryRec.characterMemory,
      conversationSummary: data.conversationSummary || memoryRec.conversationSummary,
      relationshipStatus: data.relationshipStatus || memoryRec.relationshipStatus,
      relationshipScore: newScore,
      lastUpdated: new Date()
    }).where(eq(memories.id, memoryRec.id));

    console.log(`Memory successfully updated for User ${userId}, Character ${charRec.name} (Score: ${newScore}, Status: ${data.relationshipStatus})`);
  } catch (err) {
    console.error('Failed to update long term memory:', err);
  }
}
