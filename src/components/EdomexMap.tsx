import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { legisladores } from '../data/mockData';
import { districtMunicipalities } from '../data/districtMunicipalities';

// Fix for default marker icons in Leaflet

interface EdomexMapProps {
  onDistrictSelect?: (districtId: number) => void;
  onLegislatorSelect?: (legislador: any) => void;
  onDistrictHover?: (districtId: number | null) => void;
}

const EdomexMap: React.FC<EdomexMapProps> = ({ onDistrictSelect, onLegislatorSelect, onDistrictHover }) => {
  console.log('EdomexMap rendering');
  const [geoData, setGeoData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useEffect running');
    let DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    fetch('/edomex_distritos_simplified.json')
      .then((response) => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Data loaded');
        setGeoData(data);
      })
      .catch((error) => {
        console.error('Error loading GeoJSON:', error);
        setError(error.message);
      });
  }, []);

  if (error) return <div>Error loading map: {error}</div>;
  if (!geoData) return <div>Loading map...</div>;

  const getDistrictStyle = (feature: any) => {
    const districtId = feature.properties.district_id;
    const legislador = legisladores[districtId - 1];
    return {
      fillColor: legislador?.color || '#3388ff',
      weight: 1.5,
      opacity: 1,
      color: '#333333',
      fillOpacity: 0.6
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const districtId = feature.properties.district_id;
    
    layer.on('click', () => {
      if (onDistrictSelect) {
        onDistrictSelect(districtId);
      }
      const legislador = legisladores[districtId - 1];
      if (onLegislatorSelect && legislador) {
        onLegislatorSelect(legislador);
      }
    });

    layer.on('mouseover', () => {
      if (onDistrictHover) {
        onDistrictHover(districtId);
      }
    });

    layer.on('mouseout', () => {
      if (onDistrictHover) {
        onDistrictHover(null);
      }
    });
  };

  const edomexBounds: L.LatLngBoundsExpression = [
    [18.3, -100.6], // Southwest
    [20.3, -98.5]   // Northeast
  ];

  return (
    <MapContainer 
      center={[19.5, -99.5]} 
      zoom={9} 
      maxBounds={edomexBounds}
      minZoom={8}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={geoData} style={getDistrictStyle} onEachFeature={onEachFeature} />
    </MapContainer>
  );
};

export default EdomexMap;
