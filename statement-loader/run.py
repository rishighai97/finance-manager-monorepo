
from utils.env_utils import setup_environment_variables
setup_environment_variables()
from app import setup_app

if __name__ == '__main__':

    setup_app()