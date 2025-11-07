# Ghosthook | Realtime BeEF to Discord plug and play C2 framework

**Real-time, stealthy browser automation & exfiltration via Discord webhooks**  
*Use the built-in **BeEF “Custom JavaScript”** module – no extra files needed.*

![BeEF](https://img.shields.io/badge/BeEF-Custom_JS-blue)
![Stealth](https://img.shields.io/badge/Stealth-Enabled-green)
![Discord](https://img.shields.io/badge/C2-Discord-5865F2)

---

## What it does

| Feature | Description |
|---------|-------------|
| **Live C2** | Every action is instantly reported to your Discord channel |
| **Auto-Exfil** | Cookies, `localStorage`, `sessionStorage`, page HTML, screenshots |
| **Network HAR** | Capture XHR/fetch traffic (full request/response) |
| **Credential Harvest** | Detect password fields & form submissions |
| **Stealth** | Spoofs `webdriver`, canvas, plugins, languages |
| **Command Queue** | Rate-limited to avoid webhook bans |
| **File Upload** | Screenshots, HAR, full page dump |
| **DOM Observer** | Auto-detects dynamic forms & login pages |
| **Self-Destruct** | Wipe traces on demand |
| **Persistence (optional)** | Survives page reloads via `localStorage` |

---

## How to use with **BeEF’s “Custom JavaScript”** module

1. **Create a Discord webhook**  
   *Server Settings → Integrations → Webhooks → New Webhook*  

2. **Base64-encode the webhook URL**  

   ```bash
   echo -n "https://discord.com/api/webhooks/..." | base64
   # → aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3Mv...

   ## For ethical use only in pentesting engagements or for security research, don't be an idiot and please use this responsibly and only on systems you either own or have explicit written permission to test on
