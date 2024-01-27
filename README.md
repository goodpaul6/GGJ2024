# Global Game Jam 2024

## How to debug on Meta Quest

If you want to access the page via the Meta browser, you can run ngrok locally and then send the
page to the meta using the "Immersive Web Emulator" extension (it just sends the URL).

Alternatively (and if you wanna do interactive debugging), use ADB to port forward a locally running server
(e.g. `python3 -m http.server`) and then you should be able to connect using chrome debugging tools as well?
Something like that.
