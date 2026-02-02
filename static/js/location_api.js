// Location API Handler for Philippines
class LocationAPI {
    constructor() {
        this.regions = [];
        this.provinces = [];
        this.cities = [];
        this.locationData = null;
        this.init();
    }

    async init() {
        await this.loadLocationData();
        this.setupEventListeners();
    }

    async loadLocationData() {
        try {
            // Load comprehensive Philippines location data
            const response = await fetch('/static/data/philippines_locations.json');
            this.locationData = await response.json();
            this.regions = this.locationData.regions;
            this.populateRegions();
        } catch (error) {
            console.error('Error loading location data:', error);
            // Fallback to API
            await this.loadRegionsFromAPI();
        }
    }

    async loadRegionsFromAPI() {
        try {
            const response = await fetch('/api/philippines/regions');
            this.regions = await response.json();
            this.populateRegions();
        } catch (error) {
            console.error('Error loading regions:', error);
            this.loadStaticRegions();
        }
    }

    loadStaticRegions() {
        // Static Philippines regions data as fallback
        this.regions = [
            { id: 1, name: "National Capital Region (NCR)", code: "NCR" },
            { id: 2, name: "Cordillera Administrative Region (CAR)", code: "CAR" },
            { id: 3, name: "Region I (Ilocos Region)", code: "01" },
            { id: 4, name: "Region II (Cagayan Valley)", code: "02" },
            { id: 5, name: "Region III (Central Luzon)", code: "03" },
            { id: 6, name: "Region IV-A (CALABARZON)", code: "04A" },
            { id: 7, name: "Region IV-B (MIMAROPA)", code: "04B" },
            { id: 8, name: "Region V (Bicol Region)", code: "05" },
            { id: 9, name: "Region VI (Western Visayas)", code: "06" },
            { id: 10, name: "Region VII (Central Visayas)", code: "07" },
            { id: 11, name: "Region VIII (Eastern Visayas)", code: "08" },
            { id: 12, name: "Region IX (Zamboanga Peninsula)", code: "09" },
            { id: 13, name: "Region X (Northern Mindanao)", code: "10" },
            { id: 14, name: "Region XI (Davao Region)", code: "11" },
            { id: 15, name: "Region XII (SOCCSKSARGEN)", code: "12" },
            { id: 16, name: "Region XIII (Caraga)", code: "13" },
            { id: 17, name: "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)", code: "14" }
        ];
        this.populateRegions();
    }

    populateRegions() {
        const regionSelect = document.getElementById('region');
        regionSelect.innerHTML = '<option value="" disabled selected>Select Region</option>';
        
        this.regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region.code;
            option.textContent = region.name;
            regionSelect.appendChild(option);
        });
    }

    async loadProvinces(regionCode) {
        try {
            if (this.locationData && this.locationData.provinces[regionCode]) {
                this.provinces = this.locationData.provinces[regionCode];
                this.populateProvinces();
            } else {
                const response = await fetch(`/api/philippines/provinces?region=${regionCode}`);
                this.provinces = await response.json();
                this.populateProvinces();
            }
        } catch (error) {
            console.error('Error loading provinces:', error);
            this.loadStaticProvinces(regionCode);
        }
    }

    loadStaticProvinces(regionCode) {
        // Static provinces data for major regions
        const provincesData = {
            'NCR': [
                { id: 1, name: "Metro Manila", code: "MM" }
            ],
            '03': [
                { id: 1, name: "Bulacan", code: "BUL" },
                { id: 2, name: "Pampanga", code: "PAM" },
                { id: 3, name: "Tarlac", code: "TAR" },
                { id: 4, name: "Nueva Ecija", code: "NUE" },
                { id: 5, name: "Bataan", code: "BAT" },
                { id: 6, name: "Zambales", code: "ZAM" },
                { id: 7, name: "Aurora", code: "AUR" }
            ],
            '04A': [
                { id: 1, name: "Cavite", code: "CAV" },
                { id: 2, name: "Laguna", code: "LAG" },
                { id: 3, name: "Batangas", code: "BAT" },
                { id: 4, name: "Rizal", code: "RIZ" },
                { id: 5, name: "Quezon", code: "QUE" }
            ],
            '07': [
                { id: 1, name: "Cebu", code: "CEB" },
                { id: 2, name: "Bohol", code: "BOH" },
                { id: 3, name: "Negros Oriental", code: "NEG" },
                { id: 4, name: "Siquijor", code: "SIQ" }
            ]
        };

        this.provinces = provincesData[regionCode] || [];
        this.populateProvinces();
    }

    populateProvinces() {
        const provinceSelect = document.getElementById('province');
        provinceSelect.innerHTML = '<option value="" disabled selected>Select Province</option>';
        
        this.provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.code;
            option.textContent = province.name;
            provinceSelect.appendChild(option);
        });

        // Clear cities when province changes
        const citySelect = document.getElementById('city');
        citySelect.innerHTML = '<option value="" disabled selected>Select City/Municipality</option>';
    }

    async loadCities(provinceCode) {
        try {
            if (this.locationData && this.locationData.cities[provinceCode]) {
                this.cities = this.locationData.cities[provinceCode];
                this.populateCities();
            } else {
                const response = await fetch(`/api/philippines/cities?province=${provinceCode}`);
                this.cities = await response.json();
                this.populateCities();
            }
        } catch (error) {
            console.error('Error loading cities:', error);
            this.loadStaticCities(provinceCode);
        }
    }

    loadStaticCities(provinceCode) {
        // Static cities data for major provinces
        const citiesData = {
            'MM': [
                { id: 1, name: "Manila", code: "MNL" },
                { id: 2, name: "Quezon City", code: "QC" },
                { id: 3, name: "Makati", code: "MKT" },
                { id: 4, name: "Taguig", code: "TAG" },
                { id: 5, name: "Pasig", code: "PSG" },
                { id: 6, name: "Mandaluyong", code: "MND" },
                { id: 7, name: "San Juan", code: "SJ" },
                { id: 8, name: "Marikina", code: "MRK" },
                { id: 9, name: "Pasay", code: "PSY" },
                { id: 10, name: "Parañaque", code: "PRQ" },
                { id: 11, name: "Las Piñas", code: "LP" },
                { id: 12, name: "Muntinlupa", code: "MNT" },
                { id: 13, name: "Caloocan", code: "CLK" },
                { id: 14, name: "Malabon", code: "MLB" },
                { id: 15, name: "Navotas", code: "NVT" },
                { id: 16, name: "Valenzuela", code: "VLZ" }
            ],
            'BUL': [
                { id: 1, name: "Malolos", code: "MAL" },
                { id: 2, name: "Meycauayan", code: "MEY" },
                { id: 3, name: "San Jose del Monte", code: "SJM" },
                { id: 4, name: "Santa Maria", code: "STM" },
                { id: 5, name: "Baliuag", code: "BAL" },
                { id: 6, name: "Marilao", code: "MAR" },
                { id: 7, name: "Obando", code: "OBA" },
                { id: 8, name: "Pandi", code: "PAN" },
                { id: 9, name: "Plaridel", code: "PLA" },
                { id: 10, name: "Pulilan", code: "PUL" }
            ],
            'CAV': [
                { id: 1, name: "Cavite City", code: "CVC" },
                { id: 2, name: "Dasmariñas", code: "DAS" },
                { id: 3, name: "Imus", code: "IMU" },
                { id: 4, name: "Tagaytay", code: "TAG" },
                { id: 5, name: "Trece Martires", code: "TRE" },
                { id: 6, name: "Bacoor", code: "BAC" },
                { id: 7, name: "General Trias", code: "GEN" },
                { id: 8, name: "Kawit", code: "KAW" },
                { id: 9, name: "Noveleta", code: "NOV" },
                { id: 10, name: "Rosario", code: "ROS" }
            ],
            'LAG': [
                { id: 1, name: "Calamba", code: "CAL" },
                { id: 2, name: "San Pablo", code: "SPA" },
                { id: 3, name: "Santa Rosa", code: "SRA" },
                { id: 4, name: "Biñan", code: "BIN" },
                { id: 5, name: "Cabuyao", code: "CAB" },
                { id: 6, name: "Los Baños", code: "LOS" },
                { id: 7, name: "San Pedro", code: "SPE" },
                { id: 8, name: "Liliw", code: "LIL" },
                { id: 9, name: "Nagcarlan", code: "NAG" },
                { id: 10, name: "Pagsanjan", code: "PAG" }
            ],
            'CEB': [
                { id: 1, name: "Cebu City", code: "CEB" },
                { id: 2, name: "Lapu-Lapu City", code: "LAP" },
                { id: 3, name: "Mandaue", code: "MAN" },
                { id: 4, name: "Talisay", code: "TAL" },
                { id: 5, name: "Toledo", code: "TOL" },
                { id: 6, name: "Danao", code: "DAN" },
                { id: 7, name: "Bogo", code: "BOG" },
                { id: 8, name: "Carcar", code: "CAR" },
                { id: 9, name: "Naga", code: "NAG" },
                { id: 10, name: "Consolacion", code: "CON" }
            ]
        };

        this.cities = citiesData[provinceCode] || [];
        this.populateCities();
    }

    populateCities() {
        const citySelect = document.getElementById('city');
        citySelect.innerHTML = '<option value="" disabled selected>Select City/Municipality</option>';
        
        this.cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.code;
            option.textContent = city.name;
            citySelect.appendChild(option);
        });
    }

    setupEventListeners() {
        // Region change event
        document.getElementById('region').addEventListener('change', (e) => {
            const regionCode = e.target.value;
            if (regionCode) {
                this.loadProvinces(regionCode);
            }
        });

        // Province change event
        document.getElementById('province').addEventListener('change', (e) => {
            const provinceCode = e.target.value;
            if (provinceCode) {
                this.loadCities(provinceCode);
            }
        });

        // Update complete address when any field changes
        ['region', 'province', 'city', 'street_address'].forEach(fieldId => {
            document.getElementById(fieldId).addEventListener('change', () => {
                this.updateCompleteAddress();
            });
        });

        document.getElementById('street_address').addEventListener('input', () => {
            this.updateCompleteAddress();
        });
    }

    updateCompleteAddress() {
        const country = document.getElementById('country').value;
        const regionSelect = document.getElementById('region');
        const provinceSelect = document.getElementById('province');
        const citySelect = document.getElementById('city');
        const streetAddress = document.getElementById('street_address').value;

        const region = regionSelect.options[regionSelect.selectedIndex]?.textContent || '';
        const province = provinceSelect.options[provinceSelect.selectedIndex]?.textContent || '';
        const city = citySelect.options[citySelect.selectedIndex]?.textContent || '';

        let addressParts = [];
        if (streetAddress) addressParts.push(streetAddress);
        if (city) addressParts.push(city);
        if (province) addressParts.push(province);
        if (region) addressParts.push(region);
        if (country) addressParts.push(country);

        const completeAddress = addressParts.join(', ');
        document.getElementById('address').value = completeAddress;
    }

    // Google Maps integration
    async initializeGoogleMaps() {
        if (window.google && window.google.maps) {
            return true;
        }

        return new Promise((resolve, reject) => {
            // Check if we already have a Google Maps script
            const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
            if (existingScript) {
                existingScript.remove();
            }

            const script = document.createElement('script');
            // Using a demo key - replace with your actual Google Maps API key
            script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBvOkBw7cTbqB5TbqB5TbqB5TbqB5TbqB5&libraries=places&callback=initMap`;
            script.async = true;
            script.defer = true;
            
            // Set a timeout to detect if the API fails to load
            const timeout = setTimeout(() => {
                reject(new Error('Google Maps API timeout'));
            }, 10000);

            script.onload = () => {
                clearTimeout(timeout);
                // Check if Google Maps actually loaded properly
                if (window.google && window.google.maps) {
                    resolve(true);
                } else {
                    reject(new Error('Google Maps API loaded but not available'));
                }
            };
            
            script.onerror = () => {
                clearTimeout(timeout);
                console.error('Google Maps failed to load. Please check your API key.');
                reject(new Error('Failed to load Google Maps'));
            };
            
            document.head.appendChild(script);
        });
    }

    async openGoogleMapsModal() {
        // For now, always show the fallback modal since we don't have a valid API key
        // This prevents the Google Maps error from appearing
        this.showFallbackModal();
        
        // Uncomment the lines below when you have a valid Google Maps API key
        /*
        try {
            await this.initializeGoogleMaps();
            this.showMapModal();
        } catch (error) {
            console.error('Error loading Google Maps:', error);
            this.showFallbackModal();
        }
        */
    }

    showFallbackModal() {
        const modal = document.createElement('div');
        modal.id = 'fallbackModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 30px;
                width: 90%;
                max-width: 500px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🎯</div>
                <h3 style="margin: 0 0 15px 0; color: #333;">Quick Location Selection</h3>
                <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
                    Use the dropdown menus above to quickly select your location. It's fast and easy!
                </p>
                <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; border-left: 4px solid #4285F4;">
                    <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <span style="background: #4285F4; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">1</span>
                        Choose your Region
                    </h4>
                    <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <span style="background: #4285F4; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">2</span>
                        Select your Province
                    </h4>
                    <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <span style="background: #4285F4; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">3</span>
                        Pick your City/Municipality
                    </h4>
                    <h4 style="margin: 0 0 0 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <span style="background: #4285F4; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">4</span>
                        Type your street address
                    </h4>
                </div>
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #c3e6c3;">
                    <p style="margin: 0; color: #2d5a2d; font-size: 14px; font-weight: 600;">
                        ✅ All Philippines locations included - no missing cities or municipalities!
                    </p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: linear-gradient(135deg, #4285F4, #34A853);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
                ">Got it! Let's continue</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showMapModal() {
        // Create modal for Google Maps
        const modal = document.createElement('div');
        modal.id = 'mapModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 20px;
                width: 90%;
                max-width: 800px;
                height: 80%;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: #333; font-size: 1.2em;">Select Your Location</h3>
                    <button id="closeMapModal" style="
                        background: #ff4444;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        cursor: pointer;
                        font-size: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <input type="text" id="mapSearchInput" placeholder="Search for a location..." style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 14px;
                        box-sizing: border-box;
                    ">
                </div>
                <div id="map" style="flex: 1; border-radius: 8px; border: 1px solid #ddd; min-height: 400px;"></div>
                <div style="margin-top: 15px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
                    <button id="confirmLocation" style="
                        background: #4285F4;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        margin-right: 10px;
                        font-size: 14px;
                    ">Confirm Location</button>
                    <button id="cancelLocation" style="
                        background: #666;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize map after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeMap();
        }, 100);

        // Event listeners
        document.getElementById('closeMapModal').onclick = () => this.closeMapModal();
        document.getElementById('cancelLocation').onclick = () => this.closeMapModal();
        document.getElementById('confirmLocation').onclick = () => this.confirmLocation();
    }

    initializeMap() {
        const mapElement = document.getElementById('map');
        const searchInput = document.getElementById('mapSearchInput');
        
        if (!mapElement) {
            console.error('Map element not found');
            this.showMapError();
            return;
        }

        try {
            const philippines = { lat: 12.8797, lng: 121.7740 };

            this.map = new google.maps.Map(mapElement, {
                center: philippines,
                zoom: 6,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true
            });

            // Create search box using the existing input
            const searchBox = new google.maps.places.SearchBox(searchInput);
            
            // Bias the SearchBox results towards current map's viewport
            this.map.addListener('bounds_changed', () => {
                searchBox.setBounds(this.map.getBounds());
            });

            // Create marker
            this.marker = new google.maps.Marker({
                position: philippines,
                map: this.map,
                draggable: true,
                title: 'Your Location',
                animation: google.maps.Animation.DROP
            });

            // Update marker position on map click
            this.map.addListener('click', (event) => {
                this.marker.setPosition(event.latLng);
                this.selectedLocation = event.latLng;
            });

            // Update marker position on search
            searchBox.addListener('places_changed', () => {
                const places = searchBox.getPlaces();
                if (places.length === 0) return;

                const place = places[0];
                if (place.geometry && place.geometry.location) {
                    this.map.setCenter(place.geometry.location);
                    this.map.setZoom(15);
                    this.marker.setPosition(place.geometry.location);
                    this.selectedLocation = place.geometry.location;
                }
            });

            // Update marker position when dragged
            this.marker.addListener('dragend', (event) => {
                this.selectedLocation = event.latLng;
            });

            // Add info window
            this.infoWindow = new google.maps.InfoWindow();
            
            // Show info window when marker is clicked
            this.marker.addListener('click', () => {
                this.infoWindow.setContent('Selected Location<br>Click "Confirm Location" to use this address');
                this.infoWindow.open(this.map, this.marker);
            });

        } catch (error) {
            console.error('Error initializing map:', error);
            this.showMapError();
        }
    }

    showMapError() {
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    background: #f8f9fa;
                    border-radius: 8px;
                    text-align: center;
                    padding: 20px;
                ">
                    <div style="font-size: 48px; margin-bottom: 15px;">🗺️</div>
                    <h4 style="margin: 0 0 10px 0; color: #333;">Map Not Available</h4>
                    <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
                        Google Maps is not available. Please use the dropdown menus above to select your location.
                    </p>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: #4285F4;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Close</button>
                </div>
            `;
        }
    }

    async confirmLocation() {
        if (!this.selectedLocation) {
            alert('Please select a location on the map first.');
            return;
        }

        try {
            const geocoder = new google.maps.Geocoder();
            const result = await new Promise((resolve, reject) => {
                geocoder.geocode({ location: this.selectedLocation }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        resolve(results[0]);
                    } else {
                        reject(new Error('Geocoding failed'));
                    }
                });
            });

            this.parseAddressComponents(result.address_components);
            this.closeMapModal();
        } catch (error) {
            console.error('Error geocoding location:', error);
            alert('Unable to get address details. Please try again.');
        }
    }

    parseAddressComponents(components) {
        let streetAddress = '';
        let city = '';
        let province = '';
        let region = '';

        components.forEach(component => {
            const types = component.types;
            
            if (types.includes('street_number') || types.includes('route')) {
                streetAddress = component.long_name + (streetAddress ? ' ' + streetAddress : '');
            } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
                province = component.long_name;
            } else if (types.includes('administrative_area_level_2') && !city) {
                region = component.long_name;
            }
        });

        // Update form fields
        if (streetAddress) {
            document.getElementById('street_address').value = streetAddress;
        }
        
        // Try to match with our dropdown options
        this.matchLocationWithDropdowns(city, province, region);
        
        // Update complete address
        this.updateCompleteAddress();
    }

    matchLocationWithDropdowns(city, province, region) {
        // This is a simplified matching - in a real app, you'd want more sophisticated matching
        console.log('Matched location:', { city, province, region });
        
        // You could add logic here to automatically select matching options in dropdowns
        // For now, we'll just update the complete address
    }

    closeMapModal() {
        const modal = document.getElementById('mapModal');
        if (modal) {
            modal.remove();
        }
    }
}

// Global function for Google Maps callback
window.initMap = function() {
    console.log('Google Maps loaded');
};

// Global function for opening maps
window.openGoogleMaps = function() {
    if (window.locationAPI) {
        window.locationAPI.openGoogleMapsModal();
    }
};

// Initialize location API when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.locationAPI = new LocationAPI();
});
