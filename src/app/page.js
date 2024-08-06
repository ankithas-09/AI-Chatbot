'use client'

import './styles.css';
import { TextField } from '@mui/material'
import { useRef, useEffect, useState } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Buddy. How can I help you today?",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;  
    setLoading(true)
    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
     }
    } catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    }
    setLoading(false)
  }
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }
  const messagesEndRef = useRef(null)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behaviour: "smooth" })
  }
  useEffect(() => {
    scrollToBottom()
  }, [messages]);
  
  useEffect(() => {
    const container = document.querySelector('.container');
    for (let i = 0; i < 6; i++) {
      const cube = document.createElement('div');
      cube.className = 'cube';
      container.appendChild(cube);
    }
  }, []);

  return (
    <div className="container">
      <div className="messageStack">
        <div className="messageList">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role === 'assistant' ? 'assistant' : ''}`}
              style={{ justifyContent: message.role === 'assistant' ? 'flex-start' : 'flex-end' }}
            >
              <div className={`messageContent ${message.role === 'assistant' ? 'assistant' : 'client'}`}>
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="inputRow">
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className="button"
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );  
}
