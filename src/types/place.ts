export interface OpeningHours {
  day: string;
  hours: string;
}

export interface NearbyPlace {
  name: string;
  distanceLabel: string;
}

export interface Place {
  id: string;
  name: string;
  city: string;
  category: string;
  description: string;
  photoSeed: string;
  rating: number;
  openingHours: OpeningHours[];
  ticketPrice: string;
  bestTimeToVisit: string;
  visitDuration: string;
  address: string;
  nearby: NearbyPlace[];
  day?: number;
}
