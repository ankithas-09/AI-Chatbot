import { useState, useRef, useEffect } from 'react';
import Layout from '../components/layout';
import { getCookie } from 'cookies-next';
import clientPromise from "../lib/mongodb";

export default function ChatbotPage({ username, created }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi! I'm the Buddy. How can I help you today?", isComplete: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const messageList = document.querySelector('.messageList');
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [messages]);

  const simulateTyping = (text) => {
    return new Promise((resolve) => {
      const typingDelay = 50;
      let index = 0;
      let simulatedText = '';
  
      if (typingTimeoutRef.current) {
        clearInterval(typingTimeoutRef.current);
      }
  
      typingTimeoutRef.current = setInterval(() => {
        simulatedText += text[index++];
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const botIndex = newMessages.findIndex(msg => msg.sender === 'bot' && !msg.isComplete);
  
          if (botIndex !== -1) {
            newMessages[botIndex] = { ...newMessages[botIndex], text: simulatedText };
          } else {
            newMessages.push({ sender: 'bot', text: simulatedText, isComplete: false });
          }
  
          return newMessages;
        });
  
        if (index >= text.length) {
          clearInterval(typingTimeoutRef.current);
          setMessages((prevMessages) => prevMessages.map(msg =>
            msg.sender === 'bot' && !msg.isComplete
              ? { ...msg, isComplete: true }
              : msg
          ));
          resolve();
        }
      }, typingDelay);
    });
  };  

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
  
    const userMessage = { sender: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsTyping(true);
  
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation: [...messages, userMessage] }),
      });
  
      const data = await response.json();
      if (response.ok) {
        // Only simulate typing, don't add full response again
        await simulateTyping(data.response);
      } else {
        console.error('Error from API:', data.message);
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: 'Sorry, something went wrong.' },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: 'Failed to send message.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleStop = () => {
    if (typingTimeoutRef.current) {
      clearInterval(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setIsTyping(false);
  };

  const handleFeedbackSubmit = async () => {
    if (feedback === null) return;

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: feedback, username }),
      });

      if (response.ok) {
        alert('Thank you for your feedback!');
        setShowFeedback(false);
        setFeedback(null);
      } else {
        console.error('Error from API:', await response.json());
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <Layout pageTitle="Chat with AI">
      <h2>Buddy</h2>
      <div className="messageStack">
        <div className="messageList">
          {messages.map((message, index) => (
            <div key={index} className="message">
              <div className={`messageContent ${message.sender === 'user' ? 'client' : 'assistant'}`}>
                {message.text}
              </div>
            </div>
          ))}
        </div>
        <div className="inputRow">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' ? handleSend() : null}
            className="chat-input"
          />
          <button onClick={handleSend} className="button">Send</button>
          <button onClick={handleStop} className="button">Stop</button>
        </div>
      </div>
      <button 
        className="feedback-button" 
        onClick={() => setShowFeedback(!showFeedback)}
      >
        Feedback
      </button>
      {showFeedback && (
        <div className="feedback-popup">
          <select value={feedback} onChange={(e) => setFeedback(e.target.value)}>
            <option value="" disabled>Select a rating</option>
            <option value="1">1 - Poor</option>
            <option value="2">2 - Fair</option>
            <option value="3">3 - Good</option>
            <option value="4">4 - Very Good</option>
            <option value="5">5 - Excellent</option>
          </select>
          <button onClick={handleFeedbackSubmit} className="button">Submit</button>
        </div>
      )}
      <div className="cubes-container">
        <div className="cube"></div>
        <div className="cube"></div>
        <div className="cube"></div>
        <div className="cube"></div>
        <div className="cube"></div>
        <div className="cube"></div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const req = context.req;
  const res = context.res;
  const username = getCookie('username', { req, res });

  if (!username) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
    };
  }

  const client = await clientPromise;
  const db = client.db("Users");
  const user = await db.collection("Profiles").findOne({ Username: username });

  return {
    props: { username, created: user.Created },
  };
}
