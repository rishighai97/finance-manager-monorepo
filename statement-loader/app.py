import os
from flask import Flask
from controller import statement_upload_controller
from exception import api_exception_handlers


app : Flask


def setup_app():
    global app
    app = Flask(__name__)
    app.register_blueprint(api_exception_handlers.blueprint)
    app.register_blueprint(statement_upload_controller.blueprint)

    app.run(host=os.getenv("SERVER_HOST"), port=os.getenv("SERVER_PORT"))