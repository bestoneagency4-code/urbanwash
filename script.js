// ============================================
// UrbanWash booking page behaviour
// No backend: this only formats the order and
// hands it to WhatsApp or the visitor's email app.
// ============================================

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Pricing tabs ---------- */
const tabB2C = document.getElementById('tab-b2c');
const tabB2B = document.getElementById('tab-b2b');
const panelB2C = document.getElementById('panel-b2c');
const panelB2B = document.getElementById('panel-b2b');

function showTab(which) {
  const b2c = which === 'b2c';
  tabB2C.setAttribute('aria-selected', String(b2c));
  tabB2B.setAttribute('aria-selected', String(!b2c));
  panelB2C.hidden = !b2c;
  panelB2B.hidden = b2c;
}
tabB2C.addEventListener('click', () => showTab('b2c'));
tabB2B.addEventListener('click', () => showTab('b2b'));

// Keep booking form's client-type toggle in sync with pricing tab, just as a nice touch
document.getElementById('ct-business').addEventListener('change', (e) => {
  if (e.target.checked) showTab('b2b');
});
document.getElementById('ct-individual').addEventListener('change', (e) => {
  if (e.target.checked) showTab('b2c');
});

/* ---------- Map (Leaflet + OpenStreetMap, no API key needed) ---------- */
// Default center: Phewa Lake, Pokhara
const DEFAULT_LAT = 28.2096;
const DEFAULT_LNG = 83.9586;

const map = L.map('map', {
  scrollWheelZoom: false
}).setView([DEFAULT_LAT, DEFAULT_LNG], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

let marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true }).addTo(map);

const coordsReadout = document.getElementById('coords-readout');

function updateReadout(lat, lng) {
  coordsReadout.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  coordsReadout.dataset.lat = lat;
  coordsReadout.dataset.lng = lng;
}

marker.on('dragend', () => {
  const pos = marker.getLatLng();
  updateReadout(pos.lat, pos.lng);
});

map.on('click', (e) => {
  marker.setLatLng(e.latlng);
  updateReadout(e.latlng.lat, e.latlng.lng);
});

document.getElementById('locate-btn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    coordsReadout.textContent = 'Location not supported on this browser';
    return;
  }
  coordsReadout.textContent = 'Finding you…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 16);
      marker.setLatLng([latitude, longitude]);
      updateReadout(latitude, longitude);
    },
    () => {
      coordsReadout.textContent = "Couldn't get location — drag the pin instead";
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

/* ---------- Order message building ---------- */
function buildOrderText() {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const items = document.getElementById('items').value.trim();
  const date = document.getElementById('pickup-date').value;
  const time = document.getElementById('pickup-time').value;
  const clientType = document.querySelector('input[name="clientType"]:checked').value;
  const lat = coordsReadout.dataset.lat;
  const lng = coordsReadout.dataset.lng;

  let mapLine = 'Not set';
  if (lat && lng) {
    mapLine = `https://www.google.com/maps?q=${lat},${lng}`;
  }

  const lines = [
    'UrbanWash — Pickup Request',
    '',
    `Name: ${name || '—'}`,
    `Phone: ${phone || '—'}`,
    `Client type: ${clientType}`,
    `Address: ${address || '—'}`,
    `Map pin: ${mapLine}`,
    `Preferred date: ${date || 'Any day soon'}`,
    `Preferred time: ${time}`,
    `Items: ${items || 'Will confirm at pickup'}`
  ];
  return lines.join('\n');
}

function validateForm() {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const status = document.getElementById('form-status');

  if (!name || !phone || !address) {
    status.hidden = false;
    status.textContent = 'Please fill in your name, phone and address before sending.';
    status.style.background = '#FBE9E7';
    status.style.color = '#B3261E';
    return false;
  }
  status.hidden = true;
  return true;
}

const WHATSAPP_NUMBER = '9770000000'; // TODO: replace with UrbanWash's real WhatsApp number, country code, no + or leading 0
const SUPPORT_EMAIL = 'hello@urbanwash.example'; // TODO: replace with UrbanWash's real email

document.getElementById('send-whatsapp').addEventListener('click', () => {
  if (!validateForm()) return;
  const text = encodeURIComponent(buildOrderText());
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
});

document.getElementById('send-email').addEventListener('click', () => {
  if (!validateForm()) return;
  const subject = encodeURIComponent('UrbanWash pickup request');
  const body = encodeURIComponent(buildOrderText());
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
});
