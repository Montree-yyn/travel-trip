import type { Restaurant } from "@/types/food";

import { createArrayStatus } from "./data-status";
import restaurantsData from "./restaurants.json";

const { data, status } = createArrayStatus<Restaurant>(restaurantsData, "errors.restaurantsData");

export const sampleRestaurants = data;
export const restaurantsDataStatus = status;
