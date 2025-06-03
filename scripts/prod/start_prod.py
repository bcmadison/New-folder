import os
import sys

# Activate the virtual environment
activate_this = os.path.join(os.path.dirname(__file__), '../venv/bin/activate_this.py')
with open(activate_this) as file:
    exec(file.read(), dict(__file__=activate_this))

# Start the Flask production server
os.environ['FLASK_APP'] = 'app'
os.environ['FLASK_ENV'] = 'production'
os.system('flask run --host=0.0.0.0 --port=80')
