# Running PoleGuard locally with real ESP32 data (no Lovable hosting)

Since the dashboard now runs on your own computer instead of being published
on Lovable, the ESP32 talks to your computer directly over your home WiFi —
plain HTTP, no domain name needed.

## 1. Install and run the dashboard
From the project folder:

```
npm install
npm run dev
```

Watch the terminal output — it prints the local URL, e.g.
`http://localhost:3000`. Note the port number; you'll need it below.

## 2. Add your local secrets
Create a new file named **`.env.local`** in the project root (already added
to `.gitignore` so it won't get committed) with:

```
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard: Project Settings -> API -> service_role secret key>
ESP32_INGEST_SECRET=hb11C_nWWR6yWuw3Shv7oW8ztVCXzW5uPrCBacXL5Sw
```

(Generate your own random string for `ESP32_INGEST_SECRET` if you prefer —
any long random value works, it just has to match the firmware.)

Restart `npm run dev` after adding this file so the new variables load.

## 3. Find your computer's LAN IP address
The ESP32 needs your computer's IP on the WiFi network (not `localhost`):

- **Windows:** `ipconfig` -> look for "IPv4 Address" under your WiFi adapter
- **Mac:** `ipconfig getifaddr en0`
- **Linux:** `ip addr show` -> look under your WiFi interface

Make sure the computer and the ESP32 are joined to the **same WiFi network**
(the `ssid` in the sketch).

## 4. Update the firmware (`pole_safety.ino`, attached separately)
Set:

```cpp
const char* INGEST_URL = "http://<your-computer-IP>:<port>/api/public/ingest";
const char* INGEST_SECRET = "<same value as ESP32_INGEST_SECRET above>";
```

Install the **ArduinoJson** library (Benoit Blanchon, v7.x) via Library
Manager, then flash as usual. The firmware now uses plain HTTP (no TLS),
which is correct for talking to a local dev server.

## 5. Calibrate the current sensor (optional but recommended)
```cpp
const float ACS712_MV_PER_AMP = 100.0;   // 5A module = 185, 20A = 100, 30A = 66
const float ACS712_ZERO_VOLTAGE = 1.65;  // measure this with NO load, via Serial Monitor
```

## 6. Watch it arrive
Open `http://localhost:<port>` in your browser (on the same computer running
`npm run dev`) — the Pole 1/2/3 cards should start showing live values
within a few seconds of the ESP32 connecting.

## Things that are different running locally
- **It only works while your computer is on and `npm run dev` is running.**
  Close the terminal or sleep the laptop and the ESP32's POSTs will just
  fail (it logs the HTTP error and keeps trying every 5s — nothing crashes).
- **Your LAN IP can change** if your router reassigns it (DHCP). If the
  ESP32 suddenly stops updating the dashboard, recheck the IP in step 3 and
  re-flash, or set a DHCP reservation for your computer in your router
  settings so the IP stays fixed.
- **Firewall prompt:** the first time you run `npm run dev`, your OS may
  ask whether to allow incoming network connections for Node — allow it on
  your private/home network, or the ESP32's requests will be blocked before
  they reach the dev server.
- If you later want the dashboard reachable from outside your home network
  (e.g. to show it off remotely, or so it keeps running when your laptop is
  off), that's when redeploying it somewhere (Lovable or otherwise) is worth
  revisiting — the `ingest.ts` route and firmware only need the URL/HTTPS
  bits changed back, nothing else in this integration changes.

## Recap: what changed vs. the Lovable version
- Firmware: `WiFiClientSecure` (HTTPS) -> plain `WiFiClient` (HTTP)
- `INGEST_URL`: a `*.lovable.app` domain -> `http://<lan-ip>:<port>/...`
- Secrets: Lovable's Settings -> Secrets panel -> a local `.env.local` file
- Everything else (the ingest route, the dashboard's query logic, the
  Supabase tables) is unchanged — it doesn't know or care where it's hosted.
