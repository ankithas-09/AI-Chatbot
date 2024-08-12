# Buddy: AI-Chatbot

Buddy is an AI-powered chatbot built using Next.js, React, and OpenAI. It incorporates advanced technologies such as Pinecone for vector search, MongoDB for user authentication, and Vercel for deployment. The chatbot is designed to intelligently respond to user queries by leveraging a knowledge base and various task-specific models.

## Skills

- **Next.js**
- **React**
- **OpenAI**
- **Vercel**
- **Streaming**
- **Pinecone**
- **MongoDB**

## Features

1. **Retrieval-Augmented Generation (RAG):** Implements RAG to provide responses based on a given knowledge base.
2. **Intelligent Responses:** Uses OpenAI to generate intelligent and contextually relevant responses.
3. **Task-Specific Models:** Implements models tailored to specific tasks for improved performance.
4. **User Authentication:** Provides user login and authentication using MongoDB.
5. **Feedback Mechanism:** Includes a feedback button for users to rate their experience.

## Steps for Execution

1. **Clone the Repository**

    ```bash
    git clone https://github.com/yourusername/ai-chatbot.git
    ```

2. **Set Up Environment Variables**

    Create a `.env` file in the root directory of the project and add the following environment variables:

    ```env
    OPENAI_API_KEY=${YOUR_API_KEY}
    MONGODB_URI=${YOUR_MONGODB_URI}
    PINECONE_API_KEY=20d4c3d1-1577-4ce0-8ad9-6cf29596e6d0
    PINECONE_INDEX_NAME=nextjs-ai-chatbot
    ```

3. **Install Dependencies**

    Navigate to the project directory and run:

    ```bash
    npm install
    ```

4. **Run the Development Server**

    Start the development server with:

    ```bash
    npm run dev
    ```

    Your application will be running on [http://localhost:3000](http://localhost:3000).

## Deployment

The project is deployed and can be accessed at [https://ai-chatbot-brown-two.vercel.app/](https://ai-chatbot-brown-two.vercel.app/). 

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenAI](https://openai.com) for providing the AI models.
- [Pinecone](https://www.pinecone.io) for vector search capabilities.
- [MongoDB](https://www.mongodb.com) for user authentication management.
- [Vercel](https://vercel.com) for deployment and hosting.
