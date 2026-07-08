export type FoodCategory = "restaurant" | "cafe" | "dessert" | "street-food";

export interface Restaurant {
  id: string;
  name: string;
  category: FoodCategory;
  cuisine: string;
  rating: number;
  priceLevel: 1 | 2 | 3 | 4;
  city: string;
  day?: number;
  tags: string[];
  photoSeed: string;
  distanceLabel?: string;
  isFavorite?: boolean;
}
