import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { rating, username } = req.body;

    if (!rating || !username) {
      return res.status(400).json({ message: 'Rating and username are required.' });
    }

    try {
      const client = await clientPromise;
      const db = client.db("Users");

      await db.collection("Feedback").insertOne({
        username,
        rating: parseInt(rating, 10),
        submittedAt: new Date()
      });

      res.status(200).json({ message: 'Feedback submitted successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to submit feedback.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
