import React, { useEffect, useRef, useState } from 'react';
import { sendChatMessage } from '../services/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! Ask me for travel recommendations.' }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const wsRef = useRef(null);

  const resolveWsUrl = () => {
    const envWs = import.meta.env.VITE_AGENT_WS;
    if (envWs) return envWs;
    const loc = window.location;
    const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${loc.host}/api/agent/events`;
  };

  useEffect(() => {
    wsRef.current = new WebSocket(resolveWsUrl());
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, { from: 'bot', text: data.message || event.data }]);
      } catch {
        setMessages((prev) => [...prev, { from: 'bot', text: event.data }]);
      }
    };
    wsRef.current.onerror = () => {
      setMessages((prev) => [...prev, { from: 'bot', text: 'Connection issue with AI agent.' }]);
    };
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { from: 'user', text }]);
    setInput('');
    setIsSending(true);
    try {
      const res = await sendChatMessage({ message: text });
      const reply = res?.data?.reply || 'Got it, thinking...';
      setMessages((prev) => [...prev, { from: 'bot', text: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { from: 'bot', text: 'Error talking to AI agent.' }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open travel assistant chat"
      >
        💬
      </div>
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white shadow-2xl rounded-lg flex flex-col overflow-hidden border border-gray-200">
          <div className="px-4 py-2 bg-blue-600 text-white font-semibold">Travel Assistant</div>
          <div className="flex-1 p-3 space-y-2 max-h-80 overflow-y-auto text-sm bg-gray-50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded-lg ${
                  m.from === 'user'
                    ? 'bg-blue-100 text-blue-900 self-end ml-auto'
                    : 'bg-white text-gray-900 shadow-sm'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="p-2 border-t flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Ask about flights & hotels..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={isSending}
            />
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              onClick={handleSend}
              disabled={isSending}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
