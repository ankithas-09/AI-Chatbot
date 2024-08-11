// import OpenAI from 'openai';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// export default async function handler(req, res) {
//   if (req.method === 'POST') {
//     const { prompt } = req.body;

//     try {
//       const completion = await openai.chat.completions.create({
//         model: 'gpt-3.5-turbo-0125', // Use the correct model name
//         messages: [{ role: 'user', content: prompt }],
//         max_tokens: 150,
//       });

//       const responseText = completion.choices[0].message.content.trim();
//       res.status(200).json({ response: responseText });
//     } catch (error) {
//       console.error('Error with OpenAI API:', error);
//       res.status(500).json({ message: 'Error with OpenAI API' });
//     }
//   } else {
//     res.status(405).json({ message: 'Method not allowed' });
//   }
// }


import { NextResponse } from 'next/server';
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

    const systemPrompt = `"You are a personal assistant. Answer any questions I have about the link provided.Out of context don't answer"`;

    const res = await openai_client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: augmentedQuery }
        ],
        stream: true
    });

    return res;
}

export async function POST(req) {
    const data = await req.json();
    const completion = await performRAG(data);

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });

    return new NextResponse(stream);
}