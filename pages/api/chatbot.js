import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { prompt } = req.body;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-0125', // Use the correct model name
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      });

      const responseText = completion.choices[0].message.content.trim();
      res.status(200).json({ response: responseText });
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      res.status(500).json({ message: 'Error with OpenAI API' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
