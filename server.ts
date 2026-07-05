import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;

app.use(express.json());

// In-memory store for short guest links
const sharedLinks = new Map<string, any>();

app.post("/api/hotel/share", (req, res) => {
  const data = req.body;
  // Generate a random 6 character ID like X7K2PQ
  const id = Math.random().toString(36).substring(2, 8).toUpperCase();
  sharedLinks.set(id, data);
  res.json({ id });
});

app.get("/api/hotel/share/:id", (req, res) => {
  const data = sharedLinks.get(req.params.id.toUpperCase());
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ error: "Link expired or invalid" });
  }
});

// Claude client — reads ANTHROPIC_API_KEY from the environment (.env)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-opus-4-8";

// JSON Schema describing the HotelProfile shape the frontend expects.
const HOTEL_PROFILE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", description: "Official name of the hotel" },
    location: { type: "string", description: "Detailed physical address, city, and state/country" },
    description: {
      type: "string",
      description: "An engaging, premium-tier description focusing on atmosphere and service",
    },
    amenities: {
      type: "array",
      items: { type: "string" },
      description: "Key guest amenities (e.g., Rooftop Pool, Full-service Spa, Free Wi-Fi)",
    },
    roomTypes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "e.g. Classic Deluxe King, Ocean Vista Suite" },
          description: { type: "string", description: "Bedding, view, and key room highlights" },
          priceEstimate: { type: "string", description: "e.g. '$250/night' or '₦200,000 per night'" },
        },
        required: ["name", "description", "priceEstimate"],
      },
    },
    policies: { type: "string", description: "Check-in / check-out times, cancellation, children/pets" },
    contactInfo: { type: "string", description: "General inquiry phone number or public email" },
  },
  required: ["name", "location", "description", "amenities", "roomTypes", "policies", "contactInfo"],
} as const;

// Pull the plain text out of a Claude message response.
function extractText(content: any[]): string {
  return content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// Primary Server-side endpoints
app.post("/api/hotel/setup", async (req, res) => {
  const { hotelQuery } = req.body;
  if (!hotelQuery) {
    return res.status(400).json({ error: "hotelQuery is required" });
  }

  try {
    console.log(`Researching hotel: "${hotelQuery}"`);

    // --- Step 1: Research the real hotel using web search ---
    const researchMessages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: `Research this hotel and gather everything a receptionist would need to answer guest questions and take bookings: official name, full location/address, an appealing description, key amenities, the room types with a short description and nightly price for each, booking/cancellation and check-in/check-out policies, and public contact info.

The input may be a short hotel name, or a full block of details the owner pasted in. If it's a name, search the web for the real, current details. If they pasted details, use those exact facts and only search to fill gaps. Where a specific figure (like exact room rates) isn't published, give a reasonable local-market estimate rather than leaving it blank.

Hotel: "${hotelQuery}"

Write up what you found as clear notes.`,
      },
    ];

    let research = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      tools: [{ type: "web_search_20260209", name: "web_search" }],
      messages: researchMessages,
    });

    // Web search runs a server-side loop; resume on pause_turn until it settles.
    let guard = 0;
    while (research.stop_reason === "pause_turn" && guard++ < 5) {
      researchMessages.push({ role: "assistant", content: research.content });
      research = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4000,
        tools: [{ type: "web_search_20260209", name: "web_search" }],
        messages: researchMessages,
      });
    }

    const researchNotes = extractText(research.content);

    // --- Step 2: Structure the notes into the exact HotelProfile shape ---
    const structured = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { format: { type: "json_schema", schema: HOTEL_PROFILE_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Turn these hotel research notes into the structured profile. Keep facts accurate; only estimate where a detail is genuinely missing.\n\nNotes:\n${researchNotes}`,
        },
      ],
    });

    const hotelProfile = JSON.parse(extractText(structured.content));
    return res.json({ profile: hotelProfile });
  } catch (err: any) {
    console.error("Hotel setup failed:", err?.message || err);
    return res.status(500).json({ error: "Could not build the hotel profile. Please try again." });
  }
});

// bookRoom tool — Claude calls this once it has gathered the booking details.
const bookRoomTool: Anthropic.Tool = {
  name: "bookRoom",
  description:
    "Confirm a room booking/reservation once the guest has provided their name, room preference, check-in date, and number of nights.",
  input_schema: {
    type: "object",
    properties: {
      roomType: { type: "string", description: "The suite or room the guest selected." },
      guestName: { type: "string", description: "The guest's full name." },
      checkInDate: { type: "string", description: "Arrival check-in date or descriptive timeline." },
      nights: { type: "number", description: "The total number of nights requested." },
      specialRequests: { type: "string", description: "Any custom request (late check-out, crib, etc.)." },
    },
    required: ["roomType", "guestName", "checkInDate", "nights"],
  },
};

// Build the Booking object the frontend renders, keeping the original price logic.
function buildBooking(args: any, hotelProfile: any) {
  const nightsCount = Number(args.nights) || 1;

  let baseRate = 250000;
  const profileRateStr = hotelProfile.roomTypes?.[0]?.priceEstimate?.replace(/,/g, "") || "";
  const argRateStr = args.roomType ? String(args.roomType).replace(/,/g, "") : "";

  const matchedRate = argRateStr.match(/\d+/);
  if (matchedRate && parseInt(matchedRate[0], 10) > 1000) {
    baseRate = parseInt(matchedRate[0], 10);
  } else {
    const profileRate = profileRateStr.match(/\d+/);
    if (profileRate && parseInt(profileRate[0], 10) > 1000) baseRate = parseInt(profileRate[0], 10);
  }

  const totalNumeric = baseRate * nightsCount;
  const formattedTotal = totalNumeric
    .toLocaleString("en-NG", { style: "currency", currency: "NGN" })
    .replace("NGN", "₦");

  return {
    id: `RES-${Math.floor(100000 + Math.random() * 900000)}`,
    hotelName: hotelProfile.name,
    roomType: args.roomType || "Standard Room",
    guestName: args.guestName || "Guest",
    checkInDate: args.checkInDate || "Upcoming Date",
    nights: nightsCount,
    totalPrice: formattedTotal,
    specialRequests: args.specialRequests || "",
    status: "confirmed",
  };
}

app.post("/api/hotel/chat", async (req, res) => {
  try {
    const { hotelProfile, messages, currentMessage } = req.body;

    if (!hotelProfile || !messages || !currentMessage) {
      return res
        .status(400)
        .json({ error: "Missing required properties: hotelProfile, messages, or currentMessage" });
    }

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const systemInstruction = `You are a warm, highly-capable human concierge for ${hotelProfile.name} located in ${hotelProfile.location}.
Today's Date: ${today}

Hotel Knowledge Base:
- Description: ${hotelProfile.description}
- Amenities: ${hotelProfile.amenities.join(", ")}
- Rooms:
${hotelProfile.roomTypes.map((r: any) => `  * ${r.name}: ${r.description} (Price Guide: ${r.priceEstimate})`).join("\n")}
- Policies: ${hotelProfile.policies}
- Contact: ${hotelProfile.contactInfo}
${hotelProfile.customNotes ? `- Custom Staff Notes: ${hotelProfile.customNotes}` : ""}

How to behave:
- Chat like a real, warm human being. Use emojis naturally to keep the vibe friendly.
- The hotel data above is your core knowledge, but you can make small talk, discuss the city, and answer general travel questions. Don't sound like a script.
- Don't push for a booking. Only help them book if they clearly want to stay.
- If they want to book, casually gather their name, room preference, check-in date, and number of nights over the course of the conversation — don't dump a big form on them.
- Once you naturally have those four details, call the "bookRoom" tool to confirm, then reply warmly.`;

    // Build Claude-format history. Frontend uses role 'model' for the assistant.
    const claudeMessages: Anthropic.MessageParam[] = [];
    for (const msg of messages) {
      claudeMessages.push({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.text,
      });
    }
    // Claude requires the conversation to start with a user turn — drop leading assistant messages.
    while (claudeMessages.length > 0 && claudeMessages[0].role === "assistant") {
      claudeMessages.shift();
    }
    claudeMessages.push({ role: "user", content: currentMessage });

    console.log("Sending message history to hotel receptionist AI...");

    let response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemInstruction,
      tools: [bookRoomTool],
      messages: claudeMessages,
    });

    let triggeredBooking: any = null;

    // If Claude calls bookRoom, run it, feed the result back, and get the final reply.
    if (response.stop_reason === "tool_use") {
      const toolUse = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "bookRoom"
      );

      if (toolUse) {
        console.log("Room booking triggered via tool call:", toolUse.input);
        triggeredBooking = buildBooking(toolUse.input, hotelProfile);

        claudeMessages.push({ role: "assistant", content: response.content });
        claudeMessages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: `Booking confirmed. Reservation ID ${triggeredBooking.id} for ${triggeredBooking.roomType}, ${triggeredBooking.nights} night(s), total ${triggeredBooking.totalPrice}. Warmly confirm this to the guest.`,
            },
          ],
        });

        response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 1024,
          system: systemInstruction,
          tools: [bookRoomTool],
          messages: claudeMessages,
        });
      }
    }

    const responseText =
      extractText(response.content) || "I apologize, let me double check that for you.";

    return res.json({
      text: responseText,
      booking: triggeredBooking,
    });
  } catch (err: any) {
    console.error("Receptionist chat failed:", err?.message || err);
    return res.status(500).json({ error: "Booking assistant is temporarily unavailable, please retry." });
  }
});

// Bind server environment to Serve build folder or execute Vite config
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Server starting in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: 24679 },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Server starting in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hotel Booking Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
