import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { conversation } = req.body;

    console.log('Received request with conversation:', conversation);

    try {
      const lastUserMessage = conversation.filter(msg => msg.sender === 'user').pop().text;

      const rawQueryEmbedding = await openai.embeddings.create({
        input: lastUserMessage,
        model: 'text-embedding-ada-002',
      });

      const queryEmbedding = rawQueryEmbedding.data[0].embedding;

      const topMatches = await index.query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
      });

      const contexts = topMatches.matches.map(match => match.metadata.text);

      const prompt = `
        You are a personal assistant. Here is the context and the conversation history:
        <CONTEXT>
        ${contexts.join("\n\n")}
        </CONTEXT>
        
        Conversation History:
        ${conversation.map(msg => `${msg.sender}: ${msg.text}`).join("\n")}
        
        My QUESTION:
        ${lastUserMessage}
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-0125',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      });

      const responseText = completion.choices[0].message.content.trim();
      console.log('Sending response to client:', responseText);
      res.status(200).json({ response: responseText });
    } catch (error) {
      console.error('Error with OpenAI or Pinecone API:', error);
      res.status(500).json({ message: 'Error with OpenAI or Pinecone API', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

