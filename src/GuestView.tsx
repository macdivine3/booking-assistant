import React, { useState, useEffect, useRef } from 'react';
import { Hotel, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HotelProfile, Booking, ChatMessage } from './types';

// Decode and validate the hotel profile from the URL ?d= param
function decodeProfile(encoded: string): HotelProfile | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json) as HotelProfile;
  } catch {
    return null;
  }
}

// Decode the theme gradient stored in the URL
function decodeTheme(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return 'from-[#b08d5b] to-[#c5a880]';
  }
}

export default function GuestView() {
  const [hotelProfile, setHotelProfile] = useState<HotelProfile | null>(null);
  const [themeGradient, setThemeGradient] = useState('from-[#b08d5b] to-[#c5a880]');
  const [invalid, setInvalid] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMessaging, setIsMessaging] = useState(false);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Parse profile from URL on mount
  useEffect(() => {
    const hash = window.location.hash; // e.g. #/guest?d=xxx&t=yyy
    const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryStr);
    const d = params.get('d');
    const t = params.get('t');

    if (!d) { setInvalid(true); return; }

    const profile = decodeProfile(d);
    if (!profile) { setInvalid(true); return; }

    setHotelProfile(profile);
    if (t) setThemeGradient(decodeTheme(t));

    setChatMessages([{
      id: 'welcome',
      role: 'model',
      text: `Hello! 👋 Welcome to ${profile.name}.\nI'm here to help with bookings, availability, pricing and anything about your stay.\nHow can I assist you today? ✨`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isMessaging]);

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim() || isMessaging || !hotelProfile) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsMessaging(true);

    try {
      const chatHistory = chatMessages.map(m => ({ role: m.role, text: m.text }));
      const response = await fetch('/api/hotel/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelProfile, messages: chatHistory, currentMessage: msgText })
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.text || "I apologize, let me double check that for you.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (data.booking) {
        botMsg.bookingTriggered = data.booking;
        setBookingsList(prev => [data.booking, ...prev]);
      }

      setChatMessages(prev => [...prev, botMsg]);
    } catch {
      setChatMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'model',
        text: "I apologize, our concierge system is experiencing a brief interruption. Please try again in a moment. 🙏",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsMessaging(false);
    }
  };

  // Invalid or missing link
  if (invalid) {
    return (
      <div className="min-h-screen bg-[#fcfbfa] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Hotel className="h-8 w-8 text-stone-400" />
          </div>
          <h1 className="text-xl font-bold text-stone-800 mb-2">Invalid Concierge Link</h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            This link appears to be expired or incorrect. Please request a fresh link from the hotel.
          </p>
        </div>
      </div>
    );
  }

  // Loading state while parsing
  if (!hotelProfile) {
    return (
      <div className="min-h-screen bg-[#fcfbfa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${themeGradient} flex items-center justify-center animate-pulse`}>
            <Hotel className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-stone-500 font-medium">Connecting to concierge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f2] flex flex-col items-center justify-center p-4">
      {/* Branded Chat Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-stone-900/10 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className={`bg-gradient-to-r ${themeGradient} p-5 text-white flex items-center gap-3.5 shrink-0`}>
          <div className="h-11 w-11 flex items-center justify-center bg-white/10 rounded-xl border border-white/20 shrink-0">
            <Hotel className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight font-serif-elegant truncate">{hotelProfile.name}</h1>
            <p className="text-[11px] text-white/80 flex items-center gap-1.5 font-medium mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Concierge is Online
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/60 min-h-0">
          <AnimatePresence initial={false}>
            {chatMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col max-w-[85%] text-xs ${msg.role === 'user'
                  ? 'self-end bg-stone-900 text-white rounded-2xl rounded-tr-sm p-3.5 px-4 shadow-sm ml-auto'
                  : 'self-start bg-white border border-stone-200 rounded-2xl rounded-tl-sm p-4 shadow-sm'
                }`}
              >
                <span className={`text-[9px] uppercase tracking-wider font-bold mb-1.5 block ${msg.role === 'user' ? 'text-white/50 text-right' : 'text-stone-400'}`}>
                  {msg.role === 'user' ? 'You' : 'Concierge'}
                </span>
                <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>

                {msg.bookingTriggered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3.5 p-4 rounded-xl bg-stone-950 text-white border-2 border-stone-900 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-[9px] uppercase tracking-widest font-mono text-amber-400 font-bold">RESERVATION CONFIRMED</span>
                      <span className="text-[10px] font-mono text-stone-400">{msg.bookingTriggered.id}</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-stone-300">
                      <div>
                        <span className="text-[9px] text-stone-500 block uppercase tracking-wider font-bold">Guest</span>
                        <span className="text-white font-semibold font-serif-elegant">{msg.bookingTriggered.guestName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-500 block uppercase tracking-wider font-bold">Room</span>
                        <span className="text-white font-semibold">{msg.bookingTriggered.roomType}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <span className="text-[9px] text-stone-500 block uppercase tracking-wider font-bold">Check-In</span>
                          <span className="text-white font-semibold">{msg.bookingTriggered.checkInDate}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-500 block uppercase tracking-wider font-bold">Total</span>
                          <span className="text-amber-400 font-bold font-mono">{msg.bookingTriggered.totalPrice}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 bg-white/5 border border-white/10 rounded-lg p-2 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[10px] text-stone-300">Booking received. The team will be in touch shortly.</span>
                    </div>
                  </motion.div>
                )}

                <span className={`text-[10px] mt-2 block ${msg.role === 'user' ? 'text-white/40 text-right' : 'text-stone-400'}`}>
                  {msg.timestamp}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {isMessaging && (
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm p-3.5 shadow-sm max-w-[80%] self-start">
              <span className="text-[9px] uppercase tracking-wider font-bold mb-1 block text-stone-400">Concierge</span>
              <div className="flex items-center gap-1.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-stone-100 shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); if (inputMessage.trim()) handleSendMessage(inputMessage); }}
            className="flex gap-2 bg-stone-50 border border-stone-200 rounded-xl p-1.5"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about rooms, pricing, availability..."
              disabled={isMessaging}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs focus:outline-none text-stone-900 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isMessaging || !inputMessage.trim()}
              className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-white transition bg-gradient-to-r ${themeGradient} disabled:opacity-40 cursor-pointer`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <p className="text-center text-[10px] text-stone-400 mt-2.5 font-medium">
            Powered by <span className="text-stone-600 font-semibold">ConciergeIQ</span>
          </p>
        </div>
      </div>
    </div>
  );
}
