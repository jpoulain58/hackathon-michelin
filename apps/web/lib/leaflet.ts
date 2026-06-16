/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_VERSION = "1.9.4";

export function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_VERSION}/leaflet.min.css`;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_VERSION}/leaflet.min.js`;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Leaflet non chargé"));
    document.body.appendChild(script);
  });
}
