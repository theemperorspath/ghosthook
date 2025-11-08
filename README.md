# Ghosthook | Realtime BeEF to Discord plug and play C2 framework
**Real-time, stealthy browser automation & exfiltration via Discord webhooks**  
*Use the built-in **BeEF "Custom JavaScript"** module – no extra files needed.*

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

## How to use with **BeEF's "Custom JavaScript"** module

1. **Create a Discord webhook**  
   *Server Settings → Integrations → Webhooks → New Webhook*

2. **Base64-encode the webhook URL**  
```bash
   echo -n "https://discord.com/api/webhooks/..." | base64
   # → aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3Mv...
```

3. **Copy the Ghosthook payload**  
   Open `ghosthook.js` and replace `YOUR_BASE64_WEBHOOK_HERE` with your encoded webhook

4. **Inject via BeEF**  
   - Navigate to your hooked browser in BeEF
   - Go to **Commands → Misc → Custom JavaScript**
   - Paste the entire `ghosthook.js` payload
   - Click **Execute**

5. **Monitor your Discord channel**  
   Watch real-time exfiltration data appear as embedded messages

---

## Commands

Send commands to the hooked browser via Discord by posting messages in your webhook channel. Ghosthook polls for new messages and executes them.

| Command | Description |
|---------|-------------|
| `!screenshot` | Capture and upload current viewport |
| `!dump` | Export full page HTML + resources |
| `!har` | Download network traffic log (JSON) |
| `!cookies` | Exfiltrate all cookies |
| `!storage` | Dump localStorage + sessionStorage |
| `!keylog start` | Begin keystroke capture |
| `!keylog stop` | End keystroke capture and upload log |
| `!inject <url>` | Load external script into page |
| `!eval <code>` | Execute arbitrary JavaScript |
| `!navigate <url>` | Redirect browser to new URL |
| `!destroy` | Remove all traces and disconnect |

---

## Configuration

Edit the configuration object at the top of `ghosthook.js`:
```javascript
const CONFIG = {
  webhook: atob('YOUR_BASE64_WEBHOOK_HERE'),
  pollInterval: 5000,        // Check for commands every 5s
  rateLimit: 2000,           // Min 2s between webhook posts
  enableStealth: true,       // Anti-detection measures
  enablePersistence: false,  // Survive page reloads
  autoExfil: true,           // Auto-capture on load
  capturePasswords: true,    // Monitor password fields
  maxScreenshotSize: 2048    // Max dimension for screenshots
};
```

---

## Stealth Features

Ghosthook includes multiple anti-detection techniques:

- **WebDriver spoofing** - Removes `navigator.webdriver` flag
- **Canvas fingerprint randomization** - Adds noise to prevent tracking
- **Plugin mimicry** - Spoofs realistic plugin arrays
- **Language randomization** - Rotates accept-language headers
- **Timezone masking** - Hides real timezone offset
- **Console suppression** - Hides error messages from developer tools
- **Mutation observer evasion** - Minimal DOM footprint

---

## Architecture
```
┌─────────────────┐
│  Hooked Browser │
│   (BeEF Target) │
└────────┬────────┘
         │
         │ Ghosthook.js injected
         │ via BeEF Custom JS
         ▼
┌─────────────────────────┐
│  Discord Webhook API    │
│  ┌──────────────────┐   │
│  │ Command Queue    │   │
│  │ Exfil Reports    │   │
│  │ File Uploads     │   │
│  └──────────────────┘   │
└────────┬────────────────┘
         │
         │ Real-time monitoring
         ▼
┌─────────────────┐
│ Your Discord    │
│ C2 Channel      │
└─────────────────┘
```

---

## Example Output

When Ghosthook successfully hooks a browser, you'll see embeds like this in Discord:
```
🎣 New Hook Established
─────────────────────
🌐 URL: https://example.com/login
👤 User-Agent: Mozilla/5.0...
🍪 Cookies: 12 captured
💾 Storage: 8 localStorage items
⏰ Timestamp: 2025-11-08 14:32:11 UTC
```

---

## File Structure
```
ghosthook/
├── README.md
├── ghosthook.js          # Main payload
├── examples/
│   ├── basic-hook.js     # Minimal example
│   └── advanced-c2.js    # Full-featured version
└── utils/
    ├── encoder.py        # Webhook URL encoder
    └── webhook-test.sh   # Test webhook connectivity
```

---

## Security Warning

⚠️ **This tool is for authorized security testing only**  

Ghosthook is designed for:
- Penetration testing with explicit permission
- Red team operations in controlled environments
- Security research and education

**Unauthorized use is illegal.** Always obtain written authorization before testing. Misuse may violate:
- Computer Fraud and Abuse Act (CFAA)
- Wiretap Act
- GDPR and privacy regulations
- Terms of service agreements

The authors assume no liability for misuse of this tool.

---

## Rate Limiting

Discord webhooks have strict rate limits:
- **30 requests per minute per webhook**
- **5 requests per second burst**

Ghosthook automatically queues commands and spaces requests to stay under these limits. If you hit rate limits, increase `rateLimit` in the config.

---

## Troubleshooting

**Webhook not receiving data?**
- Verify webhook URL is correctly base64-encoded
- Check browser console for CORS errors
- Ensure Discord webhook is active (not deleted)

**Commands not executing?**
- Confirm `pollInterval` is set (default 5000ms)
- Check that webhook channel allows bot messages
- Verify no CSP blocking fetch requests

**High detection rate?**
- Enable all stealth features in config
- Reduce `pollInterval` to minimize network activity
- Use HTTPS-only target sites

---

## Roadmap

- [ ] Multi-webhook load balancing
- [ ] Encrypted C2 communications
- [ ] WebRTC data channel fallback
- [ ] Mobile device fingerprinting
- [ ] Automated credential phishing templates
- [ ] Integration with other C2 frameworks

---

## Contributing

Pull requests welcome! Please:
1. Test against latest BeEF version
2. Maintain Discord rate limit compliance
3. Document new stealth techniques
4. Add examples for new features

---

## License

MIT License - See LICENSE file for details

---

## Disclaimer

This tool is provided for educational and authorized security testing purposes only. The developers are not responsible for any malicious use or damage caused by this tool. Use responsibly and ethically.

---

## Credits

- Built for **BeEF Framework** integration
- Powered by **Discord Webhook API**
- Inspired by modern browser-based C2 techniques

**Made with ☕ by 0days**
