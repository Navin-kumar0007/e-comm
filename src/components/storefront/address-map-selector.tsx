"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, X, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddressMapSelectorProps {
  onSelectAddress: (data: { address: string; city: string; state: string; pincode: string }) => void;
  triggerButtonText?: string;
}

export function AddressMapSelector({ onSelectAddress, triggerButtonText = "Locate on Map" }: AddressMapSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isDirectLocating, setIsDirectLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  // Default Coordinates: Bangalore (lat: 12.9716, lng: 77.5946)
  const [coordinates, setCoordinates] = useState({ lat: 12.9716, lng: 77.5946 });
  const [addressDetails, setAddressDetails] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletLoadedRef = useRef(false);

  // Load Leaflet Assets dynamically
  useEffect(() => {
    if (!isOpen) return;

    const loadLeafletSDK = () => {
      if (leafletLoadedRef.current) {
        initMap();
        return;
      }

      // Add CSS link
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      // Add JS script
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        leafletLoadedRef.current = true;
        initMap();
      };
      document.body.appendChild(script);
    };

    loadLeafletSDK();

    return () => {
      // Clean up map instance when modal closes
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      setMapLoaded(false);
    };
  }, [isOpen]);

  // IP Geolocation Fallback on modal open
  useEffect(() => {
    if (!isOpen || !mapLoaded) return;
    geolocateViaIP();
  }, [isOpen, mapLoaded]);

  const geolocateViaIP = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const lat = data.latitude;
        const lng = data.longitude;
        const newPos = { lat, lng };
        setCoordinates(newPos);
        
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 13);
          markerRef.current.setLatLng([lat, lng]);
        }
        await reverseGeocode(lat, lng);
        return true;
      }
    } catch (e) {
      console.warn("IP geolocation fallback failed:", e);
    }
    return false;
  };

  const initMap = () => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // Initialize Map
    const map = L.map(mapContainerRef.current).setView([coordinates.lat, coordinates.lng], 13);
    mapRef.current = map;

    // Use clean watermark-free OpenStreetMap standard tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add Draggable Marker
    const marker = L.marker([coordinates.lat, coordinates.lng], {
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    setMapLoaded(true);

    // Marker dragend listener
    marker.on("dragend", async () => {
      const position = marker.getLatLng();
      setCoordinates({ lat: position.lat, lng: position.lng });
      await reverseGeocode(position.lat, position.lng);
    });

    // Map click listener to place marker
    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCoordinates({ lat, lng });
      await reverseGeocode(lat, lng);
    });

    reverseGeocode(coordinates.lat, coordinates.lng);
  };

  // Reverse Geocoding via OSM Nominatim API
  const reverseGeocode = async (lat: number, lng: number) => {
    const data = await reverseGeocodeDirect(lat, lng);
    if (data) {
      setAddressDetails(data);
    }
  };

  // Shared Helper for reverse geocoding
  const reverseGeocodeDirect = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        
        // Formulate readable address string
        const street = addr.road || addr.suburb || addr.neighbourhood || addr.village || "";
        const city = addr.city || addr.town || addr.district || addr.county || "";
        const state = addr.state || "";
        const pincode = addr.postcode || "";
        const name = data.display_name.split(",")[0] || "";
        
        let fullAddress = "";
        if (name && name !== street) fullAddress += name + ", ";
        if (street) fullAddress += street;

        return {
          address: fullAddress || data.display_name.split(",").slice(0, 2).join(", "),
          city: city,
          state: state,
          pincode: pincode,
        };
      }
    } catch (e) {
      console.error("OSM Reverse geocoding error:", e);
    }
    return null;
  };

  // Search Address query resolution (Uses Photon Komoot Elasticsearch geocoder for lenient Indian spelling matches)
  const handleSearch = async () => {
    if (!searchQuery) return;

    setIsSearching(true);
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=1`;
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.features && data.features.length > 0) {
        const feature = data.features[0];
        const lng = feature.geometry.coordinates[0];
        const lat = feature.geometry.coordinates[1];

        setCoordinates({ lat, lng });

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 15);
          markerRef.current.setLatLng([lat, lng]);
        }

        const props = feature.properties;
        const street = props.street || props.name || "";
        const city = props.city || props.county || "";
        const state = props.state || "";
        const pincode = props.postcode || "";

        setAddressDetails({
          address: street,
          city: city,
          state: state,
          pincode: pincode,
        });
      } else {
        alert("Location not found. Please try a different spelling or add your city.");
      }
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  // Geolocate User via GPS (Inside Map Modal)
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);

    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "denied") {
          alert("Location access is blocked. Please click the location pin/lock icon in your browser URL bar to allow location access.");
        }
      });
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newPos = { lat, lng };

        setCoordinates(newPos);

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }

        await reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      async (error) => {
        console.warn("GPS geolocate failed, falling back to IP:", error);
        
        // Geolocate via IP address
        const ok = await geolocateViaIP();
        if (!ok) {
          alert("Unable to geolocate. Please enter your location in the search box.");
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Geolocate directly on form click (Without opening Map modal)
  const handleDirectGeolocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDirectLocating(true);

    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "denied") {
          alert("Location access is blocked. Please allow location permissions in your browser URL bar settings.");
        }
      });
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const addressData = await reverseGeocodeDirect(lat, lng);
        if (addressData) {
          onSelectAddress(addressData);
        }
        setIsDirectLocating(false);
      },
      async (error) => {
        console.warn("Direct GPS failed, falling back to IP:", error);
        
        // Silent IP Geolocation Fallback
        try {
          const res = await fetch("https://ipapi.co/json/");
          const data = await res.json();
          if (data && data.latitude && data.longitude) {
            const addressData = await reverseGeocodeDirect(data.latitude, data.longitude);
            if (addressData) {
              onSelectAddress(addressData);
            }
          } else {
            alert("Unable to geolocate. Please use 'Locate on Map' to search instead.");
          }
        } catch {
          alert("Unable to geolocate. Please use 'Locate on Map' to search instead.");
        }
        setIsDirectLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleApply = () => {
    onSelectAddress(addressDetails);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Locate on Map trigger button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5 h-9"
      >
        <MapPin className="w-4 h-4" /> {triggerButtonText}
      </Button>

      {/* Direct 'Use Current Location' Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDirectGeolocate}
        disabled={isDirectLocating}
        className="flex items-center gap-1.5 rounded-xl border-border text-muted-foreground hover:text-primary hover:border-primary/50 h-9"
      >
        {isDirectLocating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Geolocating...
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4" /> Use Current Location
          </>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl p-6 relative flex flex-col gap-5 scale-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-heading font-bold text-foreground">Select Delivery Location</h3>
                <p className="text-xs text-muted-foreground">Search or click on the map to place your pin.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Address Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="Search for area, street name, or city..."
                  className="pl-10 rounded-xl h-11 border-border/80 focus-visible:ring-primary"
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
              </div>
              
              <Button type="button" onClick={handleSearch} disabled={isSearching} className="rounded-xl h-11 px-5">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGeolocate}
                disabled={isLocating}
                className="rounded-xl h-11 w-11 p-0 flex items-center justify-center border-border/80 text-muted-foreground hover:text-primary"
                title="Locate Me (GPS)"
              >
                {isLocating ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-primary" />
                ) : (
                  <Navigation className="w-4.5 h-4.5" />
                )}
              </Button>
            </div>

            {/* OpenStreetMap Container */}
            <div className="relative w-full h-[280px] bg-muted rounded-2xl overflow-hidden border border-border/50">
              <div ref={mapContainerRef} className="w-full h-full z-10" />
              {!mapLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 z-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading Map Viewer...</span>
                </div>
              )}
            </div>

            {/* Address Details Output */}
            <div className="bg-muted/40 rounded-2xl p-4 border border-border/40 space-y-3 text-sm">
              <div className="flex gap-2.5 items-start">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block text-foreground">Selected Address:</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {addressDetails.address || "Select a location on the map..."}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
                <div>
                  <span className="font-semibold block text-foreground">City</span>
                  <span className="text-muted-foreground">{addressDetails.city || "—"}</span>
                </div>
                <div>
                  <span className="font-semibold block text-foreground">State</span>
                  <span className="text-muted-foreground">{addressDetails.state || "—"}</span>
                </div>
                <div>
                  <span className="font-semibold block text-foreground">Pincode</span>
                  <span className="text-muted-foreground">{addressDetails.pincode || "—"}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl h-11">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleApply}
                disabled={!addressDetails.address}
                className="rounded-xl h-11 px-8 shadow-lg shadow-primary/10"
              >
                Apply Location
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
