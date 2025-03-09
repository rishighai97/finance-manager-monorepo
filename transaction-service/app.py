import os
from flask import Flask
from exception import api_exception_handlers


app : Flask


def setup_app():
    global app
    app = Flask(__name__)
    app.register_blueprint(api_exception_handlers.blueprint)
    # app.register_blueprint(statement_upload_controller.blueprint)

def run_app():
    app.run(host=os.getenv("TRANSACTION_SERVICE_SERVER_HOST"), port=os.getenv("TRANSACTION_SERVICE_SERVER_PORT"))