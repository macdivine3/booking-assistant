import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Hotel, 
  Sparkles, 
  Calendar, 
  Send, 
  Check, 
  Plus, 
  Trash, 
  MessageSquare, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  FileText, 
  Clock, 
  PhoneCall, 
  BookmarkCheck, 
  ChevronRight, 
  Sparkle,
  Zap,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HotelProfile, RoomType, Booking, ChatMessage } from './types';

// Luxury default hotel details used to seed the demo beautifully instantly
const DEFAULT_HOTEL: HotelProfile = {
  name: "The Wheatbaker Lagos",
  location: "4 Onitolo Road, Ikoyi, Lagos, Nigeria",
  description: "Located in the heart of Ikoyi, The Wheatbaker offers a perfect blend of luxury and boutique comfort. With premium dining, a relaxing spa, and top-tier service, we provide a peaceful escape from the bustling city of Lagos.",
  amenities: [
    "Grill Room Restaurant",
    "Luxury Spa & Wellness",
    "Outdoor Swimming Pool",
    "Complimentary High-speed Wi-Fi",
    "Airport Protocol Service",
    "24/7 Security & Power"
  ],
  roomTypes: [
    {
      name: "Standard Luxury Room",
      description: "A comfortable and elegant room with a king-size bed, work desk, and a modern en-suite bathroom.",
      priceEstimate: "₦250,000 per night"
    },
    {
      name: "Executive Suite",
      description: "Spacious living area with premium decor, complimentary breakfast, and amazing city views.",
      priceEstimate: "₦450,000 per night"
    },
    {
      name: "The Wheatbaker Suite",
      description: "The peak of luxury living. Features a private lounge, 24/7 butler service, and exquisite VIP styling.",
      priceEstimate: "₦850,000 per night"
    }
  ],
  policies: "Check-in: 2:00 PM. Check-out: 12:00 PM. We offer secure valet parking. Please, no pets allowed on the property.",
  contactInfo: "+234 1 277 3560 | info@thewheatbakerlagos.com",
  customNotes: "Offer a complimentary welcome drink to all guests when they check in. Remind them that breakfast is included with the Executive Suite."
};

// Preset demo questions to make testing rapid and satisfying
const QUICK_PROMPTS = [
  "👋 What room types do you have available?",
  "🏨 How much is a standard luxury room for tonight?",
  "🍽️ Does the room price include breakfast?",
  "📅 I'd like to book the Executive Suite for 2 nights starting tomorrow."
];

// Aesthetic palettes to instantly test how the chat widget looks with different hotel branding colors
const BRAND_THEMES = [
  { id: 'gold-classic', name: 'Classic Gold', text: 'text-amber-600', bg: 'bg-amber-600', hover: 'hover:bg-amber-700', light: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-[#b08d5b] to-[#c5a880]' },
  { id: 'emerald-royal', name: 'Royal Emerald', text: 'text-emerald-700', bg: 'bg-emerald-700', hover: 'hover:bg-emerald-800', light: 'bg-emerald-50', border: 'border-emerald-200', gradient: 'from-emerald-800 to-emerald-600' },
  { id: 'burgundy-luxury', name: 'Grand Burgundy', text: 'text-rose-900', bg: 'bg-rose-900', hover: 'hover:bg-rose-950', light: 'bg-rose-50', border: 'border-rose-200', gradient: 'from-rose-950 to-rose-800' },
  { id: 'navy-marina', name: 'Imperial Navy', text: 'text-blue-900', bg: 'bg-blue-900', hover: 'hover:bg-blue-950', light: 'bg-blue-50', border: 'border-blue-200', gradient: 'from-blue-950 to-indigo-900' },
  { id: 'slate-noir', name: 'Minimale Noir', text: 'text-stone-900', bg: 'bg-stone-900', hover: 'hover:bg-stone-950', light: 'bg-stone-50', border: 'border-stone-200', gradient: 'from-stone-900 to-stone-700' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'profile' | 'rooms' | 'bookings' | 'pitch'>('profile');
  const [selectedTheme, setSelectedTheme] = useState(BRAND_THEMES[0]);
  
  // Hotel states
  const [hotelQuery, setHotelQuery] = useState('');
  const [isSourcing, setIsSourcing] = useState(false);
  const [hotelProfile, setHotelProfile] = useState<HotelProfile>(DEFAULT_HOTEL);
  const [customNotes, setCustomNotes] = useState(DEFAULT_HOTEL.customNotes || '');

  // Editing state variables for active profile
  const [editableName, setEditableName] = useState(DEFAULT_HOTEL.name);
  const [editableLocation, setEditableLocation] = useState(DEFAULT_HOTEL.location);
  const [editableDescription, setEditableDescription] = useState(DEFAULT_HOTEL.description);
  const [editablePolicies, setEditablePolicies] = useState(DEFAULT_HOTEL.policies);
  const [editableContact, setEditableContact] = useState(DEFAULT_HOTEL.contactInfo);
  const [editableAmenities, setEditableAmenities] = useState<string[]>(DEFAULT_HOTEL.amenities);
  const [newAmenity, setNewAmenity] = useState('');

  // Editable room state variables
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(DEFAULT_HOTEL.roomTypes);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomPrice, setNewRoomPrice] = useState('');

  // Session bookings simulated
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);

  // Receptionist Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! 👋 Welcome to ${DEFAULT_HOTEL.name}. I'm here to help you check room rates, answer questions about our amenities, or book a stay for you. How can I help you today? ✨`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMessaging, setIsMessaging] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync edits to profile
  useEffect(() => {
    setHotelProfile(prev => ({
      ...prev,
      name: editableName,
      location: editableLocation,
      description: editableDescription,
      policies: editablePolicies,
      contactInfo: editableContact,
      amenities: editableAmenities,
      roomTypes: roomTypes,
      customNotes: customNotes
    }));
  }, [editableName, editableLocation, editableDescription, editablePolicies, editableContact, editableAmenities, roomTypes, customNotes]);

  // Handle scrolling of chat widget
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isMessaging]);

  // Source information about a different hotel using live Google Search Grounding & deep profiling
  const handleSourceHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelQuery.trim()) return;

    setIsSourcing(true);
    try {
      const response = await fetch('/api/hotel/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelQuery })
      });

      const data = await response.json();
      if (data.error) {
        alert(`Failed to source details: ${data.error}`);
        return;
      }

      if (data.profile) {
        const profile: HotelProfile = data.profile;
        // Seed editable states instantly
        setEditableName(profile.name);
        setEditableLocation(profile.location);
        setEditableDescription(profile.description);
        setEditablePolicies(profile.policies);
        setEditableContact(profile.contactInfo);
        setEditableAmenities(profile.amenities);
        setRoomTypes(profile.roomTypes);
        setCustomNotes('');
        setHotelQuery('');

        // Clear and restart Chat with the new hotel persona
        setChatMessages([
          {
            id: 'system-setup',
            role: 'model',
            text: `Hello! 👋 Welcome to ${profile.name} located in ${profile.location}. I've successfully learnt all about our hotel and I'm ready to help you book a stay or answer your questions. What do you need help with? ✨`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong attempting to source hotel information.");
    } finally {
      setIsSourcing(false);
    }
  };

  // Main Chat engine sending user messages to our Gemini API receptionist
  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim() || isMessaging) return;

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
        body: JSON.stringify({
          hotelProfile: {
            ...hotelProfile,
            roomTypes,
            amenities: editableAmenities,
            customNotes
          },
          messages: chatHistory,
          currentMessage: msgText
        })
      });

      const data = await response.json();

      if (data.error) {
        setChatMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `Forgive me, my receptionist link is experiencing slight resistance: ${data.error}. Let me research this coordinates again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        return;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Check if a virtual booking was confirmed via function calling
      if (data.booking) {
        const newBookingObj: Booking = data.booking;
        botMsg.bookingTriggered = newBookingObj;
        
        // Add booking to the ledger dynamically so they look at the left pane update in real-time
        setBookingsList(prev => [newBookingObj, ...prev]);
      }

      setChatMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'model',
        text: "I apologize, but our reservation system is currently resting. Would you please try in an instant?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsMessaging(false);
    }
  };

  // Quick helper to insert an amenity
  const handleAddAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmenity.trim() && !editableAmenities.includes(newAmenity.trim())) {
      setEditableAmenities([...editableAmenities, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setEditableAmenities(editableAmenities.filter((_, i) => i !== index));
  };

  // Quick helpers to insert and delete room options
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomName.trim() && newRoomPrice.trim()) {
      const newRoom: RoomType = {
        name: newRoomName.trim(),
        description: newRoomDesc.trim() || "Spacious suite designed with elegant luxury interiors and exquisite lighting configurations.",
        priceEstimate: newRoomPrice.trim()
      };
      setRoomTypes([...roomTypes, newRoom]);
      setNewRoomName('');
      setNewRoomDesc('');
      setNewRoomPrice('');
    }
  };

  const handleRemoveRoom = (index: number) => {
    setRoomTypes(roomTypes.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-[#2c2824] selection:bg-amber-100 selection:text-amber-900" id="applet-viewport">
      {/* Visual Header */}
      <header className="border-b border-stone-200 bg-white/80 py-4 px-6 md:px-12 backdrop-blur-md sticky top-0 z-40" id="header-bar">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4" id="header-container">
          <div className="flex items-center gap-3" id="branding-area">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white shadow-md shadow-amber-600/10" id="app-logo-bg">
              <Hotel className="h-5 w-5" id="hotel-icon-svg" />
            </div>
            <div id="brand-words">
              <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2" id="brand-title">
                AURA <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">Grand Concierge AI</span>
              </h1>
              <p className="text-xs text-stone-500 font-medium" id="brand-sub">Premium Hotel Receptionist & Demo Sandbox</p>
            </div>
          </div>
          
          {/* Active status or Quick Sourcing */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-end" id="header-actions">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full shadow-xs" id="status-badge">
              <span className="relative flex h-2 w-2" id="live-ping-dot">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Google Search Grounding Connected
            </div>
          </div>
        </div>
      </header>

      {/* Main Single-Screen Workspace */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6" id="workspace-layout">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="split-grid-columns">
          
          {/* LEFT DASHBOARD: The Sales Control Hub & CMS */}
          <div className="lg:col-span-7 space-y-6" id="dashboard-col">
            
            {/* Quick Sourcing card */}
            <section className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs" id="sourcing-box">
              <div className="flex items-start gap-3.5 mb-3" id="source-header-box">
                <div className="p-2.5 bg-amber-50 rounded-lg text-amber-700" id="search-sparkle-bg">
                  <Sparkles className="h-5 w-5 animate-pulse" id="spark-decor-svg" />
                </div>
                <div id="source-labels">
                  <h2 className="text-base font-semibold text-stone-900" id="sourcing-title">Source Different Hotel</h2>
                  <p className="text-xs text-stone-500 leading-relaxed" id="sourcing-text">
                    Type the name of a real hotel (e.g. <i>"Transcorp Hilton Abuja"</i> or <i>"Eko Hotels Lagos"</i>). The AI will search the web instantly and learn its rooms, prices, and amenities.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSourceHotel} className="flex gap-2.5" id="sourcing-form">
                <input
                  type="text"
                  placeholder="e.g., Transcorp Hilton Abuja, or a Google link"
                  value={hotelQuery}
                  onChange={(e) => setHotelQuery(e.target.value)}
                  disabled={isSourcing}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white transition-all disabled:opacity-50 text-stone-900"
                  id="search-input-field"
                />
                <button
                  type="submit"
                  disabled={isSourcing || !hotelQuery.trim()}
                  className="bg-stone-950 text-white font-medium hover:bg-stone-900 disabled:opacity-50 disabled:hover:bg-stone-950 rounded-xl px-5 text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.98]"
                  id="source-submit-button"
                >
                  {isSourcing ? (
                    <>
                      <LoaderIcon className="animate-spin h-4 w-4" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Source & Train
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* CMS Panel Container with Tabs */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden" id="cms-panel">
              {/* Tab navigation */}
              <div className="flex border-b border-stone-100 bg-stone-50/50 p-1 gap-1" id="cms-tabs">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 py-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'profile' 
                      ? 'bg-white text-stone-900 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-800 hover:bg-white/40'
                  }`}
                  id="tab-profile"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  Hotel Profile
                </button>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`flex-1 py-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'rooms' 
                      ? 'bg-white text-stone-900 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-800 hover:bg-white/40'
                  }`}
                  id="tab-rooms"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Suites & Pricing
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`flex-1 py-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
                    activeTab === 'bookings' 
                      ? 'bg-white text-stone-900 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-800 hover:bg-white/40'
                  }`}
                  id="tab-bookings"
                >
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  Reservations
                  {bookingsList.length > 0 && (
                    <span className="absolute top-2 right-2.5 h-4 px-1.5 text-[10px] flex items-center justify-center font-bold bg-amber-600 text-white rounded-full animate-bounce">
                      {bookingsList.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('pitch')}
                  className={`flex-1 py-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'pitch' 
                      ? 'bg-white text-stone-900 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-800 hover:bg-white/40'
                  }`}
                  id="tab-pitch"
                >
                  <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                  Sales Pitch Kit
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 overflow-y-auto max-h-[580px]" id="cms-content-window">
                
                {/* 1. HOTEL PROFILE ACCORDION/FORM */}
                {activeTab === 'profile' && (
                  <div className="space-y-5" id="profile-pane">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="profile-primary-inputs">
                      <div className="space-y-1" id="group-name">
                        <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">Hotel Name</label>
                        <input
                          type="text"
                          value={editableName}
                          onChange={(e) => setEditableName(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          id="profile-name-val"
                        />
                      </div>
                      <div className="space-y-1" id="group-contact">
                        <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">Desk Contact Info</label>
                        <input
                          type="text"
                          value={editableContact}
                          onChange={(e) => setEditableContact(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          id="profile-contact-val"
                        />
                      </div>
                    </div>

                    <div className="space-y-1" id="group-loc">
                      <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">Physical Coordinates / Address</label>
                      <div className="relative" id="loc-input-parent">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                        <input
                          type="text"
                          value={editableLocation}
                          onChange={(e) => setEditableLocation(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3.5 py-2 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          id="profile-loc-val"
                        />
                      </div>
                    </div>

                    <div className="space-y-1" id="group-desc">
                      <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">Atmosphere & Luxury Bio</label>
                      <textarea
                        rows={3}
                        value={editableDescription}
                        onChange={(e) => setEditableDescription(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
                        id="profile-desc-val"
                      />
                    </div>

                    {/* STAFF OVERRIDE RULE SYSTEM (EXTREMELY COMPELLING FOR PITCH DEMOS) */}
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-1.5" id="override-container">
                      <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-wider" id="override-header">
                        <Sparkle className="h-3.5 w-3.5 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
                        Staff Override Instructions (Real-time Customization)
                      </div>
                      <p className="text-[11px] text-stone-500 leading-normal" id="override-text">
                        Add custom instructions instantly (e.g. <i>"Offer 15% discount for families"</i> or <i>"Remind guests our pool is currently being cleaned"</i>). The AI assistant instantly listens.
                      </p>
                      <textarea
                        rows={2}
                        placeholder="Add real-time notes here to live-test AI adaptivity..."
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 placeholder:text-stone-400 font-medium"
                        id="override-input-val"
                      />
                    </div>

                    <div className="space-y-1.5" id="group-amenities">
                      <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">Standout Amenities</label>
                      <div className="flex flex-wrap gap-2 mb-2" id="amenities-tags-parent">
                        {editableAmenities.map((amenity, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center gap-1 text-xs bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-full text-stone-800 transition-colors"
                            id={`amenity-tag-${index}`}
                          >
                            {amenity}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveAmenity(index)}
                              className="text-stone-400 hover:text-stone-700 transition"
                              id={`amenity-del-${index}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <form onSubmit={handleAddAmenity} className="flex gap-2" id="amenity-add-form">
                        <input
                          type="text"
                          placeholder="Add new custom amenity/feature..."
                          value={newAmenity}
                          onChange={(e) => setNewAmenity(e.target.value)}
                          className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          id="amenity-input-field"
                        />
                        <button
                          type="submit"
                          className="bg-stone-100 font-semibold hover:bg-stone-200 text-stone-700 rounded-lg px-3.5 text-xs transition"
                          id="amenity-add-button"
                        >
                          Add
                        </button>
                      </form>
                    </div>

                    <div className="space-y-1" id="group-policies">
                      <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">House Guidelines & Rules</label>
                      <textarea
                        rows={2}
                        value={editablePolicies}
                        onChange={(e) => setEditablePolicies(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        id="profile-policies-val"
                      />
                    </div>
                  </div>
                )}

                {/* 2. SUITES & ROOM RATES MANAGER */}
                {activeTab === 'rooms' && (
                  <div className="space-y-5 animate-fadeIn" id="rooms-pane">
                    <div className="flex items-center justify-between" id="rooms-headers">
                      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Scraped & Configured Room Catalog</h3>
                      <span className="text-[11px] font-medium text-stone-400">{roomTypes.length} Active Categories</span>
                    </div>

                    <div className="divide-y divide-stone-100" id="rooms-list-parent">
                      {roomTypes.map((room, index) => (
                        <div key={index} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0" id={`room-item-${index}`}>
                          <div className="space-y-0.5" id={`room-details-${index}`}>
                            <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                              {room.name}
                              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">{room.priceEstimate}</span>
                            </h4>
                            <p className="text-xs text-stone-500 leading-relaxed max-w-md">{room.description}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveRoom(index)}
                            className="p-1 px-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove category"
                            id={`room-item-del-${index}`}
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-stone-100 pt-5 mt-4" id="room-builder-anchor">
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Add Custom Guest Room</h4>
                      <form onSubmit={handleAddRoom} className="space-y-3.5 bg-stone-50/50 p-4 rounded-xl border border-stone-200/50" id="room-builder-form">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="builder-grid-top">
                          <div className="space-y-1" id="build-room-name-g">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Room Name</label>
                            <input
                              type="text"
                              placeholder="e.g., Grand Presidential Suite"
                              value={newRoomName}
                              onChange={(e) => setNewRoomName(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-950 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                              id="build-room-name-val"
                            />
                          </div>
                          <div className="space-y-1" id="build-room-price-g">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Nightly Pricing</label>
                            <input
                              type="text"
                              placeholder="e.g., ₦150,000"
                              value={newRoomPrice}
                              onChange={(e) => setNewRoomPrice(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-950 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                              id="build-room-price-val"
                            />
                          </div>
                        </div>
                        <div className="space-y-1" id="build-room-desc-g">
                          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Features / Description</label>
                          <textarea
                            rows={2}
                            placeholder="Briefly state beds, layout views, or exclusive amenities..."
                            value={newRoomDesc}
                            onChange={(e) => setNewRoomDesc(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-950 focus:outline-hidden focus:ring-1 focus:ring-amber-500 resize-none"
                            id="build-room-desc-val"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!newRoomName.trim() || !newRoomPrice.trim()}
                          className="w-full bg-stone-900 border border-stone-950 hover:bg-stone-850 text-white font-medium py-2 rounded-lg text-xs transition-colors disabled:opacity-40"
                          id="submit-room-building"
                        >
                          Save New Room Category
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* 3. SIMULATED RESERVATIONS LEDGER */}
                {activeTab === 'bookings' && (
                  <div className="space-y-4 animate-fadeIn" id="bookings-pane">
                    <div className="flex items-center justify-between" id="bookings-headers">
                      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Simulated Booking Ledger</h3>
                      <button
                        onClick={() => {
                          const csvContent = "data:text/csv;charset=utf-8,ID,Hotel,Room,Guest,CheckIn,Nights,Price\n" + 
                            bookingsList.map(b => `${b.id},"${b.hotelName}","${b.roomType}","${b.guestName}","${b.checkInDate}",${b.nights},"${b.totalPrice}"`).join("\n");
                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", `AURA_Reservations_${hotelProfile.name.replace(/\s+/g, '_')}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        disabled={bookingsList.length === 0}
                        className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 disabled:opacity-50"
                        id="export-csv-button"
                      >
                        <FileText className="h-3 w-3" />
                        Export Guest List (.csv)
                      </button>
                    </div>

                    <div className="space-y-3" id="bookings-list-content">
                      {bookingsList.length === 0 ? (
                        <div className="text-center py-12 px-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200" id="bookings-empty">
                          <div className="mx-auto w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3 block">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-semibold text-stone-700">No Reservations Recorded Yet</p>
                          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
                            Test out the booking feature on the right by chatting with the AI. Try saying: <span className="italic block mt-1 text-stone-500">"I want to book the Executive Suite for my name Divine starting next Tuesday."</span>
                          </p>
                        </div>
                      ) : (
                        bookingsList.map((booking, index) => (
                          <div 
                            key={booking.id} 
                            className="p-4 bg-[#fbf9f6] border border-stone-200 rounded-xl relative overflow-hidden transition-all duration-300 hover:shadow-xs"
                            id={`booking-card-${booking.id}`}
                          >
                            <div className="absolute right-0 top-0 h-full w-1.5 bg-emerald-600" id={`booking-stripe-${booking.id}`} />
                            <div className="flex items-start justify-between mb-2" id={`booking-top-line-${booking.id}`}>
                              <div>
                                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                                  {booking.id}
                                </span>
                                <h4 className="text-sm font-bold text-stone-900 mt-1">{booking.guestName}</h4>
                              </div>
                              <span className="text-sm font-mono font-bold text-emerald-800">{booking.totalPrice}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 border-t border-stone-100 pt-2.5 text-xs text-stone-600" id={`booking-meta-grid-${booking.id}`}>
                              <div>
                                <span className="text-[10px] text-stone-400 font-medium block uppercase tracking-wider">Hotel</span>
                                <span className="font-semibold block truncate">{booking.hotelName}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-stone-400 font-medium block uppercase tracking-wider">Room Selected</span>
                                <span className="font-semibold block truncate text-stone-800">{booking.roomType}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-stone-400 font-medium block uppercase tracking-wider">Check-In Arrival</span>
                                <span className="font-semibold block text-stone-800">{booking.checkInDate}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-stone-400 font-medium block uppercase tracking-wider">Duration</span>
                                <span className="font-semibold block text-stone-800">{booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'}</span>
                              </div>
                            </div>
                            {booking.specialRequests && (
                              <div className="mt-2 bg-stone-50 border border-stone-100 rounded-lg p-2 text-[11px] italic text-stone-500" id={`booking-request-${booking.id}`}>
                                <span className="font-semibold not-italic uppercase text-[9px] text-stone-400 block tracking-wide">Special Requests</span>
                                "{booking.specialRequests}"
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 4. SALES PITCH DECK CHEATSHEET */}
                {activeTab === 'pitch' && (
                  <div className="space-y-5 animate-fadeIn" id="pitch-pane">
                    <div className="bg-stone-950 text-white rounded-2xl p-5 relative overflow-hidden" id="pitch-header">
                      <div className="absolute top-0 right-0 p-4 opacity-15" id="pitch-logo-stencil">
                        <Hotel className="h-24 w-24" />
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">
                        Elite Demo Companion
                      </span>
                      <h3 className="text-xl font-bold font-serif-elegant tracking-tight mt-2" id="pitch-title">How to Pitch This App</h3>
                      <p className="text-xs text-stone-300 leading-relaxed mt-1" id="pitch-sub text">
                        Copy these values, talking points, and customized scenarios while you demo this live test link to hotel general managers.
                      </p>
                    </div>

                    <div className="space-y-4" id="pitch-points">
                      <div className="space-y-1" id="argument-1">
                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-100" />
                          Point 1: It Learns & Connects Instantly
                        </h4>
                        <p className="text-xs text-stone-500 leading-relaxed">
                          "We don't need to connect to your complex databases. Just give us your hotel name or Google listing, and our AI learns everything about you in <b>under 5 seconds</b>." (Show them the <b>Source & Train</b> box at the top).
                        </p>
                      </div>

                      <div className="space-y-1" id="argument-2">
                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-100" />
                          Point 2: More Direct Bookings!
                        </h4>
                        <p className="text-xs text-stone-500 leading-relaxed">
                          "Guests frequently leave websites when they can't get quick answers. By offering a friendly, 24/7 digital booking assistant that can <b>confirm reservations live</b>, you can secure more direct guests and avoid giving huge commissions to booking sites."
                        </p>
                      </div>

                      <div className="space-y-1" id="argument-3">
                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-100" />
                          Magic Selling Trick ✨
                        </h4>
                        <p className="text-xs text-stone-500 leading-relaxed">
                          Type \`Offer a 10% discount if they book today\` into the <b>Staff Override Box</b>. Then ask the chat: <i>"Are there any discounts?"</i> <b>Watch the hotel manager's face light up as the AI instantly applies the rule you just typed!</b>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Widget Accent Color Swapper (Premium Polish) */}
            <section className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs" id="widget-branding-designer">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" />
                Live Brand Customization (For Pitching)
              </h3>
              <p className="text-xs text-stone-500 mb-3.5" id="branding-desc">
                Coordinate the guest-facing chat widget's accents in real-time to match any corporate hotel identity.
              </p>
              <div className="flex flex-wrap gap-2.5" id="brand-swatches">
                {BRAND_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`flex items-center gap-2 py-1.5 px-3 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                      selectedTheme.id === theme.id 
                        ? `${theme.light} ${theme.border} ${theme.text} scale-105 ring-1 ring-offset-2 ring-stone-900/10` 
                        : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                    }`}
                    id={`swatch-btn-${theme.id}`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${theme.bg}`} id={`swatch-circle-${theme.id}`} />
                    {theme.name}
                  </button>
                ))}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: The Luxury Interactive Widget Live Simulator */}
          <div className="lg:col-span-5" id="chat-col-wrapper">
            <div className="bg-white rounded-3xl border border-stone-250 shadow-xl overflow-hidden shadow-stone-800/10 sticky top-24" id="chat-wrapper">
              
              {/* Premium Widget Top Bar */}
              <div className={`p-5 text-white bg-gradient-to-r ${selectedTheme.gradient} flex items-center justify-between shadow-md`} id="widget-titlebar">
                <div className="flex items-center gap-3.5" id="widget-hotel-badge">
                  <div className="h-10 w-10 flex items-center justify-center bg-white/10 rounded-xl backdrop-blur-md border border-white/20" id="widget-crest">
                    <Hotel className="h-5 w-5 text-white" />
                  </div>
                  <div id="widget-headings">
                    <h3 className="text-sm font-bold tracking-tight font-serif-elegant truncate max-w-[200px]" title={hotelProfile.name} id="widget-hotel-name">
                      {hotelProfile.name}
                    </h3>
                    <p className="text-[10px] text-white/85 flex items-center gap-1 font-medium" id="widget-online-label">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" id="widget-dot"></span>
                      Concierge is Online
                    </p>
                  </div>
                </div>
                
                {/* Reset dialogue */}
                <button
                  onClick={() => {
                    setChatMessages([
                      {
                        id: 'refresh',
                        role: 'model',
                        text: `Welcome back to the chat for ${hotelProfile.name}. 👋 Do you need any help with booking a room or checking our rates today?`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                  }}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white/90"
                  title="Clear conversation"
                  id="reset-chat-widget"
                >
                  <Clock className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Chat Viewport Area */}
              <div className="bg-stone-50/70 p-4 h-[440px] overflow-y-auto space-y-4 text-xs flex flex-col" id="widget-dialogue-body">
                <AnimatePresence initial={false}>
                  {chatMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end bg-stone-900 text-white rounded-2xl rounded-tr-xs p-3.5 px-4 shadow-xs ml-auto' : 'self-start bg-white border border-stone-200/80 rounded-2xl rounded-tl-xs p-4 shadow-sm'}`}
                      id={`chat-bubble-${msg.id}`}
                    >
                      {/* Message Label / Role */}
                      <span className={`text-[9px] uppercase tracking-wider font-bold mb-1.5 block ${msg.role === 'user' ? 'text-white/60 text-right' : 'text-stone-400'}`}>
                        {msg.role === 'user' ? 'Guest' : 'Receptionist'}
                      </span>
                      
                      {/* Body Content */}
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                      
                      {/* Interactive Reservation card if booking got confirmed */}
                      {msg.bookingTriggered && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="mt-3.5 p-4 rounded-xl bg-orange-50/10 border-2 border-stone-900 bg-stone-950 text-white relative overflow-hidden flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-1">
                            <span className="text-[9px] uppercase tracking-widest font-mono text-amber-400 font-bold">
                              RESERVATION CONFIRMED
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              {msg.bookingTriggered.id}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-stone-300">
                            <div>
                              <span className="text-[9px] text-stone-500 block uppercase tracking-wider font-bold">Guest</span>
                              <span className="text-white font-semibold font-serif-elegant">{msg.bookingTriggered.guestName}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-stone-500 block uppercase tracking-wider font-bold">Resort Residence Suite</span>
                              <span className="text-white font-semibold">{msg.bookingTriggered.roomType}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div>
                                <span className="text-[9px] text-stone-500 block uppercase tracking-wider font-bold">Date</span>
                                <span className="text-white font-semibold">{msg.bookingTriggered.checkInDate}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-stone-500 block uppercase tracking-wider font-bold">Estimated Cost</span>
                                <span className="text-amber-400 font-bold font-mono">{msg.bookingTriggered.totalPrice}</span>
                              </div>
                            </div>
                          </div>

                          {/* Stamp details */}
                          <div className="mt-3 bg-white/[0.03] border border-white/5 rounded-lg p-2 flex items-center justify-between">
                            <div className="text-[10px] text-stone-300">
                              <span className="font-semibold text-emerald-400 block flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Enabled in PMS Ledger
                              </span>
                              No guarantee required.
                            </div>
                            {/* Visual QR Code Generator Stencil */}
                            <div className="h-8 w-8 bg-white/90 p-0.5 rounded-xs flex items-center justify-center opacity-80" title="Reference Code QR">
                              <div className="grid grid-cols-3 gap-0.5 h-full w-full">
                                {[...Array(9)].map((_, i) => (
                                  <div key={i} className={`h-full w-full ${((i + 3) % 2 === 0) ? 'bg-stone-900' : 'bg-transparent'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <span className={`text-[10px] mt-2 block ${msg.role === 'user' ? 'text-white/40 text-right' : 'text-stone-400'}`}>
                        {msg.timestamp}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Loading typing response state */}
                {isMessaging && (
                  <div className="bg-white border border-stone-200/80 rounded-2xl rounded-tl-xs p-3.5 shadow-xs max-w-[80%] self-start" id="typing-bubble">
                    <span className="text-[9px] uppercase tracking-wider font-bold mb-1 block text-stone-400">
                      {hotelProfile.name} AI Receptionist
                    </span>
                    <div className="flex items-center gap-1.5 py-1" id="typing-dots">
                      <span className="h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                
                <div ref={chatBottomRef} id="chat-scroller-bottom-anchor" />
              </div>

              {/* Quick Prompt Selector Area */}
              <div className="p-3 border-t border-stone-100 bg-white space-y-1.5" id="quick-questions-wrapper">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider px-1">
                  💡 High-frequency testing queries
                </span>
                <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none" id="quick-scroller">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt.replace(/[^\w\s\?']/g, '').trim())}
                      disabled={isMessaging}
                      className="text-[11px] bg-stone-50 border border-stone-200/80 hover:bg-stone-100 text-[#4c443e] font-medium py-1.5 px-3.5 rounded-full cursor-pointer whitespace-nowrap shrink-0 transition"
                      id={`quick-chip-${idx}`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input form base */}
              <div className="p-4 bg-stone-50 border-t border-stone-200" id="chat-form-box">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputMessage.trim()) handleSendMessage(inputMessage);
                  }}
                  className="flex gap-2 bg-white border border-stone-200 rounded-xl p-1.5 shadow-inner"
                  id="chat-form-element"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask concierge a question or request room selection..."
                    disabled={isMessaging}
                    className="flex-1 bg-transparent px-3 py-1.5 text-xs focus:outline-hidden text-stone-900 disabled:opacity-60"
                    id="guest-chat-textbox"
                  />
                  <button
                    type="submit"
                    disabled={isMessaging || !inputMessage.trim()}
                    className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-white cursor-pointer select-none transition ${selectedTheme.bg} ${selectedTheme.hover} disabled:opacity-40`}
                    id="guest-chat-sendbtn"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Styled Footer for beautiful layout frame */}
      <footer className="border-t border-stone-100 p-8 mt-12 bg-white" id="applet-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-stone-400 gap-4" id="footer-inner bg">
          <p id="footer-words">
            Aura Concierge Engine © 2026. Custom designed with high-contrast light luxury theme and Google Search grounding indices.
          </p>
          <div className="flex gap-4" id="footer-meta-stats">
            <span className="flex items-center gap-1"><Sparkle className="h-3 w-3 text-amber-500" /> Grounded on Gemini 3.5 Flash</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3 text-amber-500" /> Active demo session</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Custom Loader Spinner helper
function LoaderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2005/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
