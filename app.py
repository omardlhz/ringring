from flask import Flask
import os

app = Flask(__name__)

# Import and register blueprints
from routes.display import display_bp

app.register_blueprint(display_bp)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 7777))
    app.run(debug=True, host="0.0.0.0", port=port)
