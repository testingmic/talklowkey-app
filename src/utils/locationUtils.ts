// Location utilities for handling coordinates and reverse geocoding
import { locationService } from "../services";

export interface ReverseGeocodeResult {
  city?: string;
  country?: string;
  error?: string;
}

/**
 * Get location from coordinates using the API endpoint
 * This uses the /api/users/location endpoint instead of IP address
 */
export const getLocationFromAPI = async (
  latitude: number | string,
  longitude: number | string
): Promise<ReverseGeocodeResult> => {
  try {
    const response = await locationService.getLocationFromCoordinates(
      latitude,
      longitude
    );

    // Handle different possible response structures
    if (response.location) {
      return {
        city: response.location.city || "Unknown",
        country: response.location.country,
      };
    } else if (response.city) {
      return {
        city: response.city || "Unknown",
        country: response.country,
      };
    }

    return { city: "Unknown" };
  } catch (error) {
    return { error: "Failed to get location from API" };
  }
};

/**
 * Convert latitude and longitude coordinates to city name using OpenStreetMap Nominatim
 * This is a free reverse geocoding service (fallback)
 */
export const reverseGeocode = async (
  latitude: number | string,
  longitude: number | string
): Promise<ReverseGeocodeResult> => {
  try {
    // Convert to numbers if they're strings
    const lat = typeof latitude === "string" ? parseFloat(latitude) : latitude;
    const lng =
      typeof longitude === "string" ? parseFloat(longitude) : longitude;

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      return { error: "Invalid coordinates" };
    }

    // Make request to Nominatim reverse geocoding API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=10`,
      {
        headers: {
          "User-Agent": "WhisperNet-App", // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.address) {
      // Extract city name from different possible fields
      const city =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.hamlet ||
        data.address.municipality ||
        data.address.county ||
        data.display_name?.split(",")[0];

      const country = data.address.country;

      return {
        city: city || "Unknown Location",
        country,
      };
    }

    return { city: "Unknown Location" };
  } catch (error) {
    return { error: "Failed to get location" };
  }
};

/**
 * Get city name from coordinates with API first, fallback to free service
 * Returns the city name or "Unknown" if both methods fail
 */
export const getCityFromCoordinates = async (
  latitude: number | string,
  longitude: number | string
): Promise<string> => {
  try {
    // Try API first
    const apiResult = await getLocationFromAPI(latitude, longitude);
    if (apiResult.city && apiResult.city !== "Unknown") {
      return apiResult.city;
    }

    // Fallback to free service
    const result = await reverseGeocode(latitude, longitude);
    return result.city || "Unknown";
  } catch (error) {
    return "Unknown";
  }
};

/**
 * Get full location (city and country) from coordinates with API first
 * Returns an object with city and country or fallback values
 */
export const getLocationFromCoordinates = async (
  latitude: number | string,
  longitude: number | string
): Promise<{ city: string; country?: string }> => {
  try {
    // Try API first
    const apiResult = await getLocationFromAPI(latitude, longitude);
    if (apiResult.city && apiResult.city !== "Unknown") {
      return {
        city: apiResult.city,
        country: apiResult.country,
      };
    }

    // Fallback to free service
    const result = await reverseGeocode(latitude, longitude);
    return {
      city: result.city || "Unknown",
      country: result.country,
    };
  } catch (error) {
    return { city: "Unknown" };
  }
};
