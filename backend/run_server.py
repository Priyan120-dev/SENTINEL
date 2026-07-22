import os
import uvicorn

if __name__ == "__main__":
    # Dynamically bind to Catalyst's PORT environment variable or default to 9000
    port_str = os.environ.get("PORT") or os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT") or "9000"
    try:
        port = int(port_str)
    except ValueError:
        port = 9000

    print(f"Starting SENTINEL API on host 0.0.0.0, port {port}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
