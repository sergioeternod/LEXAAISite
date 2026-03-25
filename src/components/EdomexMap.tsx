import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { legisladores } from '../data/mockData';
import { districtMunicipalities } from '../data/districtMunicipalities';

// Fix for default marker icons in Leaflet

interface EdomexMapProps {
  onDistrictSelect?: (districtId: number) => void;
  onLegislatorSelect?: (legislador: any) => void;
}

const EdomexMap: React.FC<EdomexMapProps> = ({ onDistrictSelect, onLegislatorSelect }) => {
  console.log('EdomexMap rendering');
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    let DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    fetch('/edomex_distritos_simplified.json')
      .then((response) => response.json())
      .then((data) => setGeoData(data))
      .catch((error) => console.error('Error loading GeoJSON:', error));
  }, []);

  if (!geoData) return <div>Loading map...</div>;

  const getDistrictStyle = (feature: any) => {
    const districtId = feature.properties.district_id;
    const legislador = legisladores[districtId - 1];
    return {
      fillColor: legislador?.color || '#3388ff',
      weight: 1.5,
      opacity: 1,
      color: '#333333',
      fillOpacity: 0.5
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const districtId = feature.properties.district_id;
    
    layer.on('click', () => {
      if (onDistrictSelect) {
        onDistrictSelect(districtId);
      }
    });

    const legislador = legisladores[districtId - 1];
    const municipios = districtMunicipalities[districtId as keyof typeof districtMunicipalities] || [];
    const municipiosText = municipios.join(', ');

    if (legislador) {
      layer.bindPopup(`
        <div style="font-family: sans-serif;">
          <h3 style="margin: 0 0 5px 0;">Distrito ${districtId}</h3>
          <p style="margin: 0;"><strong>Legislador:</strong> ${legislador.nombre}</p>
          <p style="margin: 0;"><strong>Partido:</strong> ${legislador.partido}</p>
          <p style="margin: 5px 0;"><strong>Municipios:</strong> ${municipiosText}</p>
          <button id="btn-view-${districtId}" style="margin-top: 10px; color: #3388ff; text-decoration: underline; cursor: pointer; background: none; border: none; padding: 0; font-size: 14px;">
            Ver perfil completo
          </button>
        </div>
      `);

      layer.on('popupopen', () => {
        console.log('Popup opened for district', districtId);
        const btn = document.getElementById(`btn-view-${districtId}`);
        if (btn) {
          btn.onclick = () => {
            console.log('Button clicked for district', districtId);
            if (onLegislatorSelect) {
              onLegislatorSelect(legislador);
            }
          };
        }
      });
    } else {
      layer.bindPopup(`
        <div style="font-family: sans-serif;">
          <h3 style="margin: 0;">Distrito ${districtId}</h3>
          <p style="margin: 5px 0;"><strong>Municipios:</strong> ${municipiosText}</p>
          <p style="margin: 0;">Legislador no encontrado</p>
        </div>
      `);
    }
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
