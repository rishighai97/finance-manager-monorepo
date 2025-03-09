import importlib
import pkgutil

from dotenv import find_dotenv, load_dotenv
import argparse


def setup_environment_variables():
    argument_parser = argparse.ArgumentParser()
    argument_parser.add_argument(
        '--app-profile',
        required=True,
        choices=['local', 'dev', 'qa', 'prod'],
        help='Mention application profile required to configure environment variables',
        type=str
    )
    app_profile = argument_parser.parse_args().app_profile
    if not load_dotenv(find_dotenv(f'./account-service/resources/env_variables/.env.{app_profile}', usecwd=True), override=False):
        raise Exception(f"Unable to load environment variable file for app profile - {app_profile}")

def import_subclasses_from_package(package_name):
    package = importlib.import_module(package_name)
    for _, module_name, _ in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
        importlib.import_module(module_name)


def get_all_subclasses(cls):
    subclasses = set(cls.__subclasses__())
    for subclass in subclasses.copy():
        subclasses.update(get_all_subclasses(cls=subclass))
    return subclasses