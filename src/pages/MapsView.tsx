
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader } from "@googlemaps/js-api-loader";
import { toast } from "sonner";

export default function MapsView() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    const loader = new Loader({
      apiKey: "YOUR_GOOGLE_MAPS_API_KEY", // You need to replace this with a real API key
      version: "weekly",
    });

    loader.load().then(() => {
      const mapElement = document.getElementById("map") as HTMLElement;
      const map = new google.maps.Map(mapElement, {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to New York
        zoom: 12,
      });
      setMap(map);
    }).catch(err => {
      toast.error("Error loading Google Maps");
      console.error(err);
    });
  }, []);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    // Add markers for each issue
    if (typeof window !== 'undefined' && window.globalIssues?.length > 0) {
      const newMarkers = window.globalIssues.map(issue => {
        // Convert location string to coordinates
        const [lat, lng] = issue.location.split(',').map(Number);
        
        if (isNaN(lat) || isNaN(lng)) return null;

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: issue.title,
        });

        // Add click listener to show info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div>
              <h3>${issue.title}</h3>
              <p>${issue.description}</p>
              <p>Status: ${issue.status}</p>
              <p>Reporter: ${issue.reporter}</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        return marker;
      }).filter(Boolean) as google.maps.Marker[];

      setMarkers(newMarkers);
    }
  }, [map]);

  return (
    <div className="min-h-screen p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0" />
      
      <div className="relative z-10 space-y-8">
        <h1 className="text-3xl font-bold text-glow">Problem Locations</h1>
        
        <Card className="p-6 glass">
          <div id="map" className="w-full h-[600px] rounded-lg"></div>
        </Card>
      </div>
    </div>
  );
}
