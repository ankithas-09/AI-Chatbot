import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from "@langchain/openai";

const embedModel = "text-embedding-3-small";

const embeddings = new OpenAIEmbeddings({
    openaiApiKey: process.env.OPENAI_API_KEY,
    modelName: embedModel
});

const openai_client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const pineconeIndex = pc.Index(process.env.PINECONE_INDEX_NAME);

async function performRAG(conversation) {
    if (!Array.isArray(conversation)) {
        throw new Error('Invalid conversation format. Expected an array.');
    }

    try {
        const lastFewMessages = conversation.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join("\n");
        const lastMessage = conversation.filter(msg => msg.role === 'user').pop().content;

        const rawQueryEmbedding = await openai_client.embeddings.create({
            input: lastMessage,
            model: embedModel
        });

        const queryEmbedding = rawQueryEmbedding.data[0].embedding;

        const topMatches = await pineconeIndex.namespace('wikipedia-articles').query({
            vector: queryEmbedding,
            topK: 310,
            includeMetadata: true,
        });

        const contexts = topMatches.matches.map(match => match.metadata.text);

        const augmentedQuery = `<CONTEXT>\n${contexts.slice(0, 10).join("\n\n-------\n\n")}\n-------\n</CONTEXT>\n\n\n\nMY CONVERSATION:\n${lastFewMessages}\n\nMy QUESTION:\n${lastMessage}`;

        const systemPrompt = `"You are a personal assistant. Answer any questions I have about the link provided."`;

        const res = await openai_client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: augmentedQuery }
            ],
            stream: true
        });

        return res;
    } catch (error) {
        console.error('Error in performRAG:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        return await POST(req, res);
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}

export async function POST(req, res) {
    try {
        const data = req.body; // Use req.body to access the parsed JSON body
        const completion = await performRAG(data);

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            // Remove '**' characters
                            const cleanedContent = content.replace(/\*\*/g, '');
                            const text = encoder.encode(cleanedContent);
                            controller.enqueue(text);
                        }
                    }
                } catch (err) {
                    console.error('Error processing stream:', err);
                    controller.error(err);
                } finally {
                    controller.close();
                }
            },
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = stream.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(decoder.decode(value));
        }

        res.end();
    } catch (error) {
        console.error('Error in POST handler:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
