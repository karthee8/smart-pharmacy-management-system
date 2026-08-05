# Debuggers & AI System Diagnostic Report

This report documents the current debugging setup, active warnings, and the exact technical root causes for why the Google Gemini AI integration fails or underperforms in the Smart Stock Pharmacy Management System.

---

## 1. Debugging & Error Logging Architecture

### A. Application Crash Logger (`crash.log`)
* **Location:** `C:\Users\<User>\AppData\Local\SmartStockPharmacy\crash.log`
* **Mechanism:** `app.py` sets `sys.excepthook = exception_handler` to catch unhandled Python exceptions.
* **Limitation:** Exceptions caught inside Flask route handlers (`try...except` blocks) return HTTP `500` JSON responses instead of being written to `crash.log`.

### B. PyInstaller Debugger Warning (`-Xfrozen_modules=off`)
* **Warning Message:**
  ```
  Debugger warning: It seems that frozen modules are being used, which may make the debugger miss breakpoints. Please pass -Xfrozen_modules=off to python to disable frozen modules.
  ```
* **Impact:** Python 3.12 freezes standard library modules by default. IDE debuggers (VS Code / PyCharm) cannot attach breakpoints to compiled `.exe` runs unless launched with `-Xfrozen_modules=off`.

### C. PyWebView UI Console Debugger
* **Mechanism:** PyWebView manages the desktop webview window (`webview.create_window`).
* **Current State:** `webview.start()` is called without `debug=True`.
* **Impact:** Right-click "Inspect Element" and developer tool consoles are disabled in the desktop window, hiding JavaScript errors.

---

## 2. Technical Causes of AI Integration Failures

The AI engine powers 4 key modules (`/api/chat`, `/api/anatomy-symptom`, `/api/vision-prescription`, and `/api/check-interactions`). The system encounters errors due to the following 5 issues:

### 1. Invalid Hardcoded Fallback API Key
* **Location:** `app.py` line 41:
  ```python
  GLOBAL_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_FALLBACK_API_KEY_HERE")
  ```
* **Root Cause:** The fallback string `"AQ.Ab8RN6..."` is an invalid key string (Google Gemini keys begin with `AIzaSy...`). Without setting a valid `GEMINI_API_KEY` in environment variables, all Google API calls return HTTP `403 Forbidden`.

### 2. Invalid / Region-Restricted Model Name (`gemini-2.5-pro`)
* **Location:** `app.py` line 44:
  ```python
  global_fast_model = genai.GenerativeModel("gemini-2.5-pro")
  ```
* **Root Cause:** `gemini-2.5-pro` is not an official model identifier across all Google API tiers. Unrecognized model identifiers return HTTP `404 Model Not Found`.
* **Recommended Fix:** Change to `gemini-1.5-flash`, `gemini-1.5-pro`, or `gemini-2.0-flash`.

### 3. Deprecated AI SDK (`google.generativeai`)
* **Location:** `app.py` line 35:
  ```python
  import google.generativeai as genai
  ```
* **Root Cause:** Google has deprecated `google.generativeai`. It must be migrated to the new `google.genai` package.

### 4. Prescription Image Over-Compression
* **Location:** `app.py` lines 991-992 in `/api/vision-prescription`:
  ```python
  img = img.convert("L")
  img.thumbnail((250, 250))
  ```
* **Root Cause:** Downscaling handwritten prescription images to 250x250 pixels degrades OCR text legibility, causing Gemini to return empty arrays `[]` or fail image analysis.

### 5. Lack of Network & Quota Fallbacks
* **Root Cause:** AI API invocations do not provide offline fallback logic or graceful handling when API quotas are exceeded, resulting in unhandled 500 server errors in the UI.

---

## 3. Recommended Code Adjustments

```python
# 1. Update imports to modern SDK
from google import genai

# 2. Use official production model name
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
response = client.models.generate_content(
    model="gemini-1.5-flash",
    contents="..."
)

# 3. Enable PyWebView Debug Mode in app.py
webview.start(debug=True)
```
