import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { users, characters, messages, memories } from './src/db/schema.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { getOrCreateMemory, updateLongTermMemory } from './src/lib/memory.ts';
import { eq, and, or, asc } from 'drizzle-orm';
import { INITIAL_CHARACTERS } from './src/data.ts';
import { GoogleGenAI } from '@google/genai';

const PORT = 3000;

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
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Endpoint: Sync user from Firebase auth to Postgres
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { email, username, avatarUrl } = req.body;
      const uid = req.user!.uid;
      
      const user = await getOrCreateUser(uid, email, username, avatarUrl);
      
      return res.json({
        user: {
          id: user.id.toString(), // The frontend might expect string id, though pg serial is integer. We return string for compatibility.
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          joinedDate: user.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '',
        }
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  // API Endpoint: Get all characters
  app.get('/api/characters', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let currentUserUid: string | null = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        try {
          const decoded = await adminAuth.verifyIdToken(token);
          currentUserUid = decoded.uid;
        } catch (e) {
          // Ignore invalid token
        }
      }

      let userRec = null;
      if (currentUserUid) {
        userRec = await db.select().from(users).where(eq(users.uid, currentUserUid)).then(r => r[0]);
      }

      let dbCharacters;
      if (userRec) {
        dbCharacters = await db.select().from(characters)
          .where(or(
            eq(characters.isPublic, true),
            eq(characters.creatorId, userRec.id)
          ));
      } else {
        dbCharacters = await db.select().from(characters)
          .where(eq(characters.isPublic, true));
      }
      
      if (dbCharacters.length === 0) {
        // Seed database
        const seedData = INITIAL_CHARACTERS.map(c => ({
          charId: c.id,
          name: c.name,
          tagline: c.tagline,
          description: c.description,
          avatarUrl: c.avatarUrl,
          systemPrompt: c.systemPrompt,
          initialMessage: c.initialMessage,
          category: c.category,
          isCustom: false,
          chatsCount: c.chatsCount,
          rating: c.rating,
          isPublic: true,
          tags: '',
          bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
        }));
        
        await db.insert(characters).values(seedData).onConflictDoNothing();
        dbCharacters = await db.select().from(characters).where(eq(characters.isPublic, true));
      }
      
      // Map to frontend expected format
      const formattedChars = dbCharacters.map(c => ({
        ...c,
        id: c.charId,
      }));

      return res.json(formattedChars);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to load characters' });
    }
  });

  // API Endpoint: Create custom character
  app.post('/api/characters', requireAuth, async (req: AuthRequest, res) => {
    try {
      const character = req.body;
      if (!character.name || !character.tagline || !character.initialMessage) {
        return res.status(400).json({ error: 'Name, tagline, and initialMessage are required' });
      }

      const uid = req.user!.uid;
      const userRec = await db.select().from(users).where(eq(users.uid, uid)).then(r => r[0]);
      if (!userRec) return res.status(401).json({ error: 'User record not found' });
      
      const charId = 'char-' + Math.random().toString(36).substring(2, 9);
      
      const newChar = await db.insert(characters).values({
        charId,
        name: character.name,
        tagline: character.tagline,
        description: character.description || '',
        avatarUrl: character.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        systemPrompt: character.systemPrompt || '',
        initialMessage: character.initialMessage,
        category: character.category || 'Helper',
        isCustom: true,
        creatorId: userRec.id,
        bannerUrl: character.bannerUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
        isPublic: character.isPublic !== undefined ? character.isPublic : true,
        tags: character.tags || '',
      }).returning();
      
      const mappedChar = {
        ...newChar[0],
        id: newChar[0].charId
      };

      return res.status(201).json(mappedChar);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create character' });
    }
  });

  // API Endpoint: Edit character
  app.put('/api/characters/:charId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { charId } = req.params;
      const character = req.body;
      const uid = req.user!.uid;

      if (!character.name || !character.tagline || !character.initialMessage) {
        return res.status(400).json({ error: 'Name, tagline, and initialMessage are required' });
      }

      const userRec = await db.select().from(users).where(eq(users.uid, uid)).then(r => r[0]);
      if (!userRec) return res.status(401).json({ error: 'User record not found' });

      const charRec = await db.select().from(characters).where(eq(characters.charId, charId)).then(r => r[0]);
      if (!charRec) return res.status(404).json({ error: 'Character not found' });

      // Only the creator can edit
      if (charRec.creatorId !== userRec.id) {
        return res.status(403).json({ error: 'You are not authorized to edit this character' });
      }

      const updatedChar = await db.update(characters)
        .set({
          name: character.name,
          tagline: character.tagline,
          description: character.description || '',
          avatarUrl: character.avatarUrl || charRec.avatarUrl,
          systemPrompt: character.systemPrompt || '',
          initialMessage: character.initialMessage,
          category: character.category || 'Helper',
          bannerUrl: character.bannerUrl || charRec.bannerUrl,
          isPublic: character.isPublic !== undefined ? character.isPublic : true,
          tags: character.tags || '',
        })
        .where(eq(characters.charId, charId))
        .returning();

      const mappedChar = {
        ...updatedChar[0],
        id: updatedChar[0].charId
      };

      return res.json(mappedChar);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to edit character' });
    }
  });

  // API Endpoint: Delete character
  app.delete('/api/characters/:charId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { charId } = req.params;
      const uid = req.user!.uid;

      const userRec = await db.select().from(users).where(eq(users.uid, uid)).then(r => r[0]);
      if (!userRec) return res.status(401).json({ error: 'User record not found' });

      const charRec = await db.select().from(characters).where(eq(characters.charId, charId)).then(r => r[0]);
      if (!charRec) return res.status(404).json({ error: 'Character not found' });

      // Only the creator can delete
      if (charRec.creatorId !== userRec.id) {
        return res.status(403).json({ error: 'You are not authorized to delete this character' });
      }

      // First delete associated messages
      await db.delete(messages).where(eq(messages.characterId, charRec.id));

      // Then delete character
      await db.delete(characters).where(eq(characters.charId, charId));

      return res.json({ success: true, message: 'Character deleted successfully' });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete character' });
    }
  });

  // API Endpoint: Get message history for a character
  app.get('/api/chats/:charId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { charId } = req.params;
      const uid = req.user!.uid;

      // Find user internal ID
      const userRec = await db.select().from(users).where(eq(users.uid, uid)).then(r => r[0]);
      if (!userRec) return res.status(401).json({ error: 'User not found in DB' });

      // Find character internal ID
      const charRec = await db.select().from(characters).where(eq(characters.charId, charId)).then(r => r[0]);
      if (!charRec) return res.status(404).json({ error: 'Character not found' });

      const history = await db.select().from(messages)
        .where(and(
          eq(messages.userId, userRec.id),
          eq(messages.characterId, charRec.id)
        ))
        .orderBy(asc(messages.timestamp));
      
      // Map to frontend expected structure
      const mappedHistory = history.map(m => ({
        id: m.id.toString(),
        characterId: charId,
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      return res.json(mappedHistory);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to load chat history' });
    }
  });

  // API Endpoint: Get the long term memory and relationship status for a character
  app.get('/api/memories/:charId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { charId } = req.params;
      const uid = req.user!.uid;

      const userRec = await db.select().from(users).where(eq(users.uid, uid)).then(r => r[0]);
      if (!userRec) return res.status(401).json({ error: 'User not found in DB' });

      const charRec = await db.select().from(characters).where(eq(characters.charId, charId)).then(r => r[0]);
      if (!charRec) return res.status(404).json({ error: 'Character not found' });

      const memory = await getOrCreateMemory(userRec.id, charRec.id);
      return res.json(memory);
    } catch (err: any) {
      console.error('Failed to get character memory:', err);
      res.status(500).json({ error: 'Failed to retrieve memory' });
    }
  });

  // API Endpoint: Post a message and get a streaming persona-specific response
  app.post('/api/chats/:charId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { charId } = req.params;
      const { messageText } = req.body;
      const uid = req.user!.uid;

      if (!messageText) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      const userRec = await db.select().from(users).where(eq(users.uid, uid)).then(r => r[0]);
      if (!userRec) return res.status(401).json({ error: 'User not found in DB' });

      const charRec = await db.select().from(characters).where(eq(characters.charId, charId)).then(r => r[0]);
      if (!charRec) return res.status(404).json({ error: 'Character not found' });

      // Retrieve or initialize the long term memory for this user & character
      const memory = await getOrCreateMemory(userRec.id, charRec.id);

      // Store user message in DB
      await db.insert(messages).values({
        userId: userRec.id,
        characterId: charRec.id,
        sender: 'user',
        content: messageText
      });

      // Get entire chat history to send as context (excluding system instructions or seeding)
      const history = await db.select().from(messages)
        .where(
          and(
            eq(messages.userId, userRec.id),
            eq(messages.characterId, charRec.id)
          )
        )
        .orderBy(asc(messages.timestamp));

      // Map chat history into standard Gemini multi-turn format
      // Gemini expects format like contents: [{ role: 'user', parts: [{ text: '...' }] }]
      const contents = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Set headers for streaming response
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Initialize Gemini client lazily
      const ai = getGeminiClient();

      const systemInstruction = `You are roleplaying as ${charRec.name}, with the tagline: "${charRec.tagline}".
Description: ${charRec.description}
Archetype/Category: ${charRec.category}
Descriptors/Tags: ${charRec.tags || 'none'}

Here is your relationship status with this user: ${memory.relationshipStatus} (Relationship Score: ${memory.relationshipScore}/100)

Your accumulated dynamic facts and notes about this user:
${memory.userMemory || "No explicit facts recalled yet."}

Your own private journey recollections or things you recall:
${memory.characterMemory || "No special dynamic events recalled yet."}

High-level summary of your conversation history so far:
${memory.conversationSummary || "The dialogue has just begun."}

Here are your core persona guidelines and lore:
${charRec.systemPrompt}

Strictly stay in character as ${charRec.name}. Respond naturally using their voice, tone, vocabulary, and style. Never break character, and never write meta explanations. Do not include prefixes like "${charRec.name}:" or similar in your response.`;

      // Call generateContentStream using gemini-3.5-flash
      const stream = await ai.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
        }
      });

      let fullBotReply = '';
      for await (const chunk of stream) {
        const textChunk = chunk.text;
        if (textChunk) {
          fullBotReply += textChunk;
          res.write(textChunk);
        }
      }

      // Store final accumulated bot message to database
      if (fullBotReply.trim()) {
        await db.insert(messages).values({
          userId: userRec.id,
          characterId: charRec.id,
          sender: 'bot',
          content: fullBotReply
        });

        // Trigger memory update asynchronously in the background so it doesn't block the reply speed!
        updateLongTermMemory(userRec.id, charRec.id, messageText, fullBotReply).catch(err => {
          console.error('Async memory update failed:', err);
        });
      }

      res.end();

    } catch (err: any) {
      console.error('Failed to process streaming chat:', err);
      // If headers haven't been sent yet, send a JSON error. Otherwise, end the stream.
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to process chat' });
      } else {
        res.end();
      }
    }
  });

  // Vite middleware setup
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
    console.log(`AI Roleplay Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
