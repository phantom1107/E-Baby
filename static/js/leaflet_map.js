// Leaflet Map for Address Selection
let map = null;
let marker = null;
let selectedLocation = null;

// Initialize map when register tab is opened
function initializeLeafletMap() {
  if (map !== null) return; // Already initialized

  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  // Create map centered on Philippines
  map = L.map('map').setView([12.8797, 121.7740], 6);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    minZoom: 4
  }).addTo(map);

  // Handle map clicks
  map.on('click', function(e) {
    handleMapClick(e.latlng);
  });

  // Add search/geocoder control
  try {
    L.Control.geocoder({
      defaultMarkGeocode: false
    })
      .on('markgeocode', function(result) {
        const bbox = result.geocode.bbox;
        const latLng = L.latLngBounds(
          [bbox.getSouthWest(), bbox.getNorthEast()]
        );
        map.fitBounds(latLng);
        
        // Place marker
        const center = latLng.getCenter();
        handleMapClick(center);
        
        // Do NOT update street address - user should fill it manually
      })
      .addTo(map);
  } catch (e) {
    console.warn('Geocoder not available:', e);
  }

  // Attach button listener AFTER map is created
  setupSelectLocationButton();
}

// Setup Select Location button with proper event handling
function setupSelectLocationButton() {
  const selectBtn = document.getElementById('selectLocationBtn');
  if (!selectBtn) {
    console.warn('Select location button not found');
    return;
  }

  // Remove old listeners by cloning
  const newBtn = selectBtn.cloneNode(true);
  selectBtn.parentNode.replaceChild(newBtn, selectBtn);

  // Add new listener
  newBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Button clicked, selectedLocation:', selectedLocation);
    
    if (selectedLocation) {
      applyLocationToForm();
    } else {
      alert('Please click on the map to select a location first.');
    }
  });
}

// Region and Province mapping for Philippines
const REGION_PROVINCE_MAP = {
  'Laguna': 'Region IV-A (CALABARZON)',
  'Batangas': 'Region IV-A (CALABARZON)',
  'Cavite': 'Region IV-A (CALABARZON)',
  'Quezon': 'Region IV-A (CALABARZON)',
  'Rizal': 'Region IV-A (CALABARZON)',
  'Metro Manila': 'National Capital Region (NCR)',
  'Abra': 'Cordillera Administrative Region (CAR)',
  'Apayao': 'Cordillera Administrative Region (CAR)',
  'Benguet': 'Cordillera Administrative Region (CAR)',
  'Ifugao': 'Cordillera Administrative Region (CAR)',
  'Kalinga': 'Cordillera Administrative Region (CAR)',
  'Mountain Province': 'Cordillera Administrative Region (CAR)',
  'Ilocos Norte': 'Region I (Ilocos Region)',
  'Ilocos Sur': 'Region I (Ilocos Region)',
  'La Union': 'Region I (Ilocos Region)',
  'Pangasinan': 'Region I (Ilocos Region)',
  'Batanes': 'Region II (Cagayan Valley)',
  'Cagayan': 'Region II (Cagayan Valley)',
  'Isabela': 'Region II (Cagayan Valley)',
  'Nueva Vizcaya': 'Region II (Cagayan Valley)',
  'Quirino': 'Region II (Cagayan Valley)',
  'Aurora': 'Region III (Central Luzon)',
  'Bataan': 'Region III (Central Luzon)',
  'Bulacan': 'Region III (Central Luzon)',
  'Nueva Ecija': 'Region III (Central Luzon)',
  'Pampanga': 'Region III (Central Luzon)',
  'Tarlac': 'Region III (Central Luzon)',
  'Zambales': 'Region III (Central Luzon)',
  'Marinduque': 'Region IV-B (MIMAROPA)',
  'Occidental Mindoro': 'Region IV-B (MIMAROPA)',
  'Oriental Mindoro': 'Region IV-B (MIMAROPA)',
  'Palawan': 'Region IV-B (MIMAROPA)',
  'Romblon': 'Region IV-B (MIMAROPA)',
  'Albay': 'Region V (Bicol Region)',
  'Camarines Norte': 'Region V (Bicol Region)',
  'Camarines Sur': 'Region V (Bicol Region)',
  'Catanduanes': 'Region V (Bicol Region)',
  'Masbate': 'Region V (Bicol Region)',
  'Sorsogon': 'Region V (Bicol Region)',
  'Aklan': 'Region VI (Western Visayas)',
  'Antique': 'Region VI (Western Visayas)',
  'Capiz': 'Region VI (Western Visayas)',
  'Guimaras': 'Region VI (Western Visayas)',
  'Iloilo': 'Region VI (Western Visayas)',
  'Negros Occidental': 'Region VI (Western Visayas)',
  'Bohol': 'Region VII (Central Visayas)',
  'Cebu': 'Region VII (Central Visayas)',
  'Negros Oriental': 'Region VII (Central Visayas)',
  'Siquijor': 'Region VII (Central Visayas)',
  'Biliran': 'Region VIII (Eastern Visayas)',
  'Eastern Samar': 'Region VIII (Eastern Visayas)',
  'Leyte': 'Region VIII (Eastern Visayas)',
  'Northern Samar': 'Region VIII (Eastern Visayas)',
  'Samar': 'Region VIII (Eastern Visayas)',
  'Southern Leyte': 'Region VIII (Eastern Visayas)',
  'Zamboanga del Norte': 'Region IX (Zamboanga Peninsula)',
  'Zamboanga del Sur': 'Region IX (Zamboanga Peninsula)',
  'Zamboanga Sibugay': 'Region IX (Zamboanga Peninsula)',
  'Misamis Occidental': 'Region X (Northern Mindanao)',
  'Misamis Oriental': 'Region X (Northern Mindanao)',
  'Bukidnon': 'Region X (Northern Mindanao)',
  'Lanao del Norte': 'Region X (Northern Mindanao)',
  'Davao del Norte': 'Region XI (Davao Region)',
  'Davao del Sur': 'Region XI (Davao Region)',
  'Davao Oriental': 'Region XI (Davao Region)',
  'Davao Occidental': 'Region XI (Davao Region)',
  'Cotabato': 'Region XII (SOCCSKSARGEN)',
  'Sarangani': 'Region XII (SOCCSKSARGEN)',
  'South Cotabato': 'Region XII (SOCCSKSARGEN)',
  'Sultan Kudarat': 'Region XII (SOCCSKSARGEN)',
  'Agusan del Norte': 'Region XIII (Caraga)',
  'Agusan del Sur': 'Region XIII (Caraga)',
  'Dinagat Islands': 'Region XIII (Caraga)',
  'Surigao del Norte': 'Region XIII (Caraga)',
  'Surigao del Sur': 'Region XIII (Caraga)'
};

// Handle map click to place marker and get address
async function handleMapClick(latlng) {
  const { lat, lng } = latlng;
  
  // Remove previous marker
  if (marker) {
    map.removeLayer(marker);
  }

  // Add new marker
  marker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      shadowSize: [41, 41],
      iconAnchor: [12, 41],
      shadowAnchor: [12, 41],
      popupAnchor: [1, -34]
    })
  }).addTo(map);

  // Show Select Location button
  const selectBtn = document.getElementById('selectLocationBtn');
  if (selectBtn) {
    selectBtn.style.display = 'flex';
  }

  // Reverse geocode to get address
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    
    // Extract address components
    const addressComponents = data.address || {};
    
    // Extract province - could be in 'state' or 'province' field
    let province = addressComponents.state || addressComponents.province || '';
    
    // Determine region based on province mapping
    let region = REGION_PROVINCE_MAP[province] || addressComponents.region || '';
    
    // If we still don't have a region but have a province, try the mapping
    if (!region && province) {
      region = REGION_PROVINCE_MAP[province] || '';
    }
    
    // Store location data
    selectedLocation = {
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      country: addressComponents.country || 'Philippines',
      region: region,
      province: province,
      city: addressComponents.city || addressComponents.town || addressComponents.village || '',
      street: '', // Don't include street - only city/municipality should be used
      houseNumber: '', // Don't include house number
      barangay: '', // Don't include barangay
      fullAddress: data.display_name || ''
    };

    console.log('Location data:', selectedLocation);

    // Show marker popup
    const popupText = `<strong>Selected Location</strong><br>${data.display_name || 'No address found'}`;
    marker.bindPopup(popupText).openPopup();

  } catch (error) {
    console.error('Geocoding error:', error);
    // Fallback
    selectedLocation = {
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      country: 'Philippines',
      region: '',
      province: '',
      city: '',
      street: '',
      houseNumber: '',
      barangay: '',
      fullAddress: `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    };
    
    marker.bindPopup(`<strong>Location Selected</strong><br>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`).openPopup();
  }
}

// Apply selected location to form
function applyLocationToForm() {
  if (!selectedLocation) {
    alert('No location selected. Please click on the map first.');
    return;
  }

  console.log('Applying location to form:', selectedLocation);

  // Update coordinate fields
  document.getElementById('latitude').value = selectedLocation.lat;
  document.getElementById('longitude').value = selectedLocation.lng;

  // Update address fields - ONLY populate country, region, province, and city
  document.getElementById('country').value = selectedLocation.country || 'Philippines';
  document.getElementById('region').value = selectedLocation.region || '';
  document.getElementById('province').value = selectedLocation.province || '';
  document.getElementById('city').value = selectedLocation.city || '';

  // IMPORTANT: Leave street_address blank - user should fill this manually
  // Do NOT populate it with street, house number, barangay, or full address
  document.getElementById('street_address').value = '';

  // Visual feedback
  const selectBtn = document.getElementById('selectLocationBtn');
  if (selectBtn) {
    const originalHtml = selectBtn.innerHTML;
    selectBtn.innerHTML = '<i class="fas fa-check"></i> Location Applied!';
    selectBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    setTimeout(() => {
      selectBtn.innerHTML = originalHtml;
      selectBtn.style.background = '';
    }, 2500);
  }

  console.log('Location applied successfully');
}

// Resize map when tab changes
function resizeMapForTab() {
  if (map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }
}

// Initialize on document ready
document.addEventListener('DOMContentLoaded', function() {
  // Watch for tab changes
  const registerTab = document.querySelector('[data-tab="register"]');
  if (registerTab) {
    registerTab.addEventListener('click', function() {
      console.log('Register tab clicked, initializing map');
      setTimeout(initializeLeafletMap, 100);
      setTimeout(resizeMapForTab, 300);
    });
  }

  // Check if register form is already active on load
  const registerForm = document.getElementById('register-form');
  if (registerForm && registerForm.classList.contains('active')) {
    console.log('Register form is active, initializing map');
    setTimeout(initializeLeafletMap, 100);
  }
});

// Monitor form visibility changes
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.attributeName === 'class') {
      const target = mutation.target;
      if (target.id === 'register-form' && target.classList.contains('active')) {
        console.log('Form became active, resizing map');
        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 300);
      }
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    observer.observe(registerForm, { attributes: true });
  }
});
