import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
// const MAPTILER_KEY = "KydZlIiVFdYDFFfQ4QYq"
const supabaseUrl = 'https://zwwqibbgdnpwskfqpuvj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3d3FpYmJnZG5wd3NrZnFwdXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg0NTY5MzUsImV4cCI6MjAyNDAzMjkzNX0.XfAbJ8vOuljcq3ELAsIpor-dwFTHkAMTd0wDazVHbtI'
const supabase = createClient(supabaseUrl, supabaseKey);
const markers = {}
async function fetchData() {
	const { data, error } = await supabase.from('test').select();
	if (error) {
		console.error(error);
	} else {
		data.forEach(item => {
			addMarker(item);
			updatePanel(item);
		});
	}
}

function updatePanel(item) {
	// Get the 'View' tab
	let viewTab = document.getElementById('View');

	// Create a new table if it doesn't exist
	let table = viewTab.querySelector('table');
	if (!table) {
		table = document.createElement('table');
		viewTab.appendChild(table);

		// Add table headers
		let thead = document.createElement('thead');
		thead.innerHTML = `
			<tr>
				<th>Name</th>
				<th>Description</th>
				<th>Zoom</th>
			</tr>
		`;
		table.appendChild(thead);
	}

	// Create a new row for this item
	let tr = document.createElement('tr');

	// Create a structured HTML layout for the item
    tr.innerHTML = `
        <td>${item.name || ''}</td>
        <td>${item.description || ''}</td>
        <td><button class="zoom-marker"><i class="fas fa-search-plus"></i></button></td>
    `;

    // Add the new row to the table
    table.appendChild(tr);

    // Add event listener to the Zoom to Marker button
    tr.querySelector('.zoom-marker').addEventListener('click', function() {
        zoomToMarker(item.id);
    });
}

function zoomToMarker(id) {
	// Get the marker
	let marker = markers[id];
	console.log(marker)
	// Check if the marker exists
	if (!marker) {
		console.error('Marker not found:', id);
		return;
	}

	// Get the marker's position
	let position = marker.getLngLat();

	// Set the map's view to the marker's position with a zoom level of 13
	map.flyTo({center: [position.lng, position.lat], zoom: 13});
}
fetchData();
const MAPTILER_KEY = 'get_your_own_OpIi9ZULNHzrESv6T2vL';
const map = new maplibregl.Map({
    style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`,
    center: [-118.25133692966446, 34.00095151499077],
    zoom: 15.5,
    pitch: 10,
    bearing: 0,
    container: 'map',
    antialias: true
});

// Add a click event to the map
map.on('click', (event) => {
    // Get the latitude and longitude of the clicked location
    const { lng, lat } = event.lngLat;

    // Find the form fields for longitude and latitude
    const longitudeField = document.querySelector('#longitude');
    const latitudeField = document.querySelector('#latitude');

    // Set the value of the form fields to the clicked location's coordinates
    longitudeField.value = lng;
    latitudeField.value = lat;
});
// The 'building' layer in the streets vector source contains building-height
// data from OpenStreetMap.
map.on('load', () => {
    // Insert the layer beneath any symbol layer.
    const layers = map.getStyle().layers;

    let labelLayerId;
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
        }
    }

    map.addSource('openmaptiles', {
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
        type: 'vector',
    });

    map.addLayer(
        {
            'id': '3d-buildings',
            'source': 'openmaptiles',
            'source-layer': 'building',
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
                'fill-extrusion-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'render_height'], 0, 'lightgray', 200, 'royalblue', 400, 'lightblue'
                ],
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    16,
                    ['get', 'render_height']
                ],
                'fill-extrusion-base': ['case',
                    ['>=', ['get', 'zoom'], 16],
                    ['get', 'render_min_height'], 0
                ]
            }
        },
        labelLayerId
    );
});

// Get the current hour
const currentHour = new Date().getHours();

// Define the light settings for day and night
const dayLight = {
    'light': {
        'anchor': 'viewport',
        'color': 'white',
        'intensity': 0.6
    }
};

const nightLight = {
    'light': {
        'anchor': 'viewport',
        'color': 'blue',
        'intensity': 0.3
    }
};

function init(){
	subscribeToTableChanges()
	console.log('subscribed to table changes')
}
init()

function addMarker(item) {
	const popupElement = document.createElement('div');
	popupElement.innerHTML = `
		<h3>${item.name}</h3>
		<p>${item.details}</p>
		<button class="edit-marker" data-id="${item.id}">Edit</button>
		<button class="delete-marker" data-id="${item.id}">Delete</button>
	`;

	popupElement.querySelector('.edit-marker').addEventListener('click', (event) => {
		editMarker(event.target.dataset.id);
	});

	popupElement.querySelector('.delete-marker').addEventListener('click', (event) => {
		deleteMarker(event.target.dataset.id);
	});

	const popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(popupElement);

	const marker = new maplibregl.Marker()
		.setLngLat(item.location.coordinates)
		.setPopup(popup)
		.addTo(map);

	markers[item.id] = marker;
	// Fetch and display the data
}
async function deleteMarker(id) {
    const { error } = await supabase
        .from('test')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting data: ', error);
    }
}
function subscribeToTableChanges() {
	const subscription = supabase
		.channel('custom-all-channel')
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'test' },
			(payload) => {
				switch (payload.eventType) {
					case 'INSERT':
						addMarker(payload.new);
						break;
					case 'UPDATE':
						const updatedMarker = markers[payload.new.id];
						if (updatedMarker) {
							updatedMarker.setLngLat(payload.new.location.coordinates);
							const popupContent = updatedMarker.getPopup().getElement();
							popupContent.querySelector('h3').textContent = payload.new.name;
							popupContent.querySelector('p').textContent = payload.new.details;
							popupContent.querySelector('.edit-marker').dataset.id = payload.new.id;
							popupContent.querySelector('.delete-marker').dataset.id = payload.new.id;
						}
						break;
					case 'DELETE':
						const deletedMarker = markers[payload.old.id];
						if (deletedMarker) {
							deletedMarker.remove();
							delete markers[payload.old.id];
						}
						break;
				}
			}
		)
		.subscribe();
}

function editMarker(id) {
	// Get the data for the marker
	const marker = markers[id];
	const coordinates = marker.getLngLat();

	// Find the form fields for name, details, longitude, and latitude
	const nameField = document.querySelector('#name');
	const detailsField = document.querySelector('#details');
	const longitudeField = document.querySelector('#longitude');
	const latitudeField = document.querySelector('#latitude');

	// Set the value of the form fields to the marker's data
	const popupContent = marker.getPopup().getElement();
	nameField.value = popupContent.querySelector('h3').textContent;
	detailsField.value = popupContent.querySelector('p').textContent;
	longitudeField.value = coordinates.lng;
	latitudeField.value = coordinates.lat;

	// Set a data attribute on the form to the id of the marker being edited
	const form = document.querySelector('#add-place');
	form.dataset.editing = id;
}
document.addEventListener('DOMContentLoaded', (event) => {
	// Add geolocate control to the map

    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener('click', function(event) {
            openTab(event, this.textContent);
        });
    }

	const geolocate = new maplibregl.GeolocateControl({
		positionOptions: {
			enableHighAccuracy: true
		},
		trackUserLocation: true
	});
	map.addControl(geolocate, 'top-right');
	// Select the form
    const form = document.querySelector('#add-place');

    // Select the geolocate button
    const geolocateButton = document.querySelector('#geolocate');

    // Add an event listener for the geolocate button click
    geolocateButton.addEventListener('click', (event) => {
        // Check if the Geolocation API is available
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by your browser');
            return;
        }

        // Get the user's current position
        navigator.geolocation.getCurrentPosition((position) => {
            // Update the longitude and latitude fields in the form
            form.querySelector('#longitude').value = position.coords.longitude;
            form.querySelector('#latitude').value = position.coords.latitude;
        }, () => {
            console.error('Unable to retrieve your location');
        });
    });
	// Add an event listener for the form submission
	form.addEventListener('submit', async (event) => {
		// Prevent the form from causing a page reload
		event.preventDefault();

		// Get the form data
		const formData = new FormData(form);
		const name = formData.get('name');
		const details = formData.get('details');
		const longitude = parseFloat(formData.get('longitude'));
		const latitude = parseFloat(formData.get('latitude'));

		// Check if we're editing an existing marker or creating a new one
		if (form.dataset.editing) {
			// We're editing an existing marker
			const id = form.dataset.editing;

			// Update the marker in the 'test' table
			const { error } = await supabase
				.from('test')
				.update({ name: name, details: details, location: { type: 'Point', coordinates: [longitude, latitude] } })
				.eq('id', id);

			if (error) {
				console.error('Error updating data: ', error);
			} else {
				console.log('Data updated successfully!');
			}

			// Clear the form's editing state
			delete form.dataset.editing;
		} else {
			// We're creating a new marker
			const { error } = await supabase
				.from('test')
				.insert([
					{ name: name, details: details, location: { type: 'Point', coordinates: [longitude, latitude] } },
				]);

			if (error) {
				console.error('Error inserting data: ', error);
			} else {
				console.log('Data inserted successfully!');
			}
		}
	});
});