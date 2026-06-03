export interface RoomType {
  name: string;
  description: string;
  priceEstimate: string;
}

export interface HotelProfile {
  name: string;
  location: string;
  description: string;
  amenities: string[];
  roomTypes: RoomType[];
  policies: string;
  contactInfo: string;
  customNotes?: string;
}

export interface Booking {
  id: string;
  hotelName: string;
  roomType: string;
  guestName: string;
  checkInDate: string;
  nights: number;
  totalPrice: string;
  specialRequests?: string;
  status: 'pending' | 'confirmed';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  bookingTriggered?: Booking;
}
