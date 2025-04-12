#!/usr/bin/env python3
# python3 claude_get_context.py [app_key1] [app_key2] ... [app_keyN]
import os
import sys
import argparse
import re
from typing import Dict, List, Tuple, Set

codebase_path = '/Users/rishighai/Desktop/finance-manager-application'
context_file_base_path = '/Users/rishighai/Desktop/finance-manager-application/statement-loader/resources/claude'

class AppConfig:
    def __init__(self, codebase_path: str, output_path: str):
        self.codebase_path = codebase_path
        self.output_path = output_path


def get_app_configs() -> Dict[str, AppConfig]:
    """
    Returns a dictionary mapping app key names to their configuration.
    """
    return {
        "account": AppConfig(
            f"{codebase_path}/account-service",
            f"{context_file_base_path}/claude-context-account.txt"
        ),
        "transaction": AppConfig(
            f"{codebase_path}/transaction-service",
            f"{context_file_base_path}/claude-context-transaction.txt"
        ),
        "ui": AppConfig(
            f"{codebase_path}/finance-manager-ui/src",
            f"{context_file_base_path}/claude-context-ui.txt"
        )
        # Add more app configurations as needed
    }


def is_relevant_file(filename: str, app_type: str) -> bool:
    """
    Determines if a file is relevant based on the app type (ionic or spring boot).

    Args:
        filename: The name of the file to check
        app_type: Either 'ionic' or 'spring'

    Returns:
        True if the file is relevant, False otherwise
    """
    lowercase_filename = filename.lower()

    # Files to exclude regardless of app type
    if any(exclude in lowercase_filename for exclude in [
        '.git', 'node_modules', '.idea', '.vscode', '.ds_store',
        '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.mp4', '.mp3', '.pdf',
        '.lock', '.gradle', '.iml', 'target/', 'build/'
    ]):
        return False

    if app_type == "ionic":
        # Ionic/Angular app file extensions
        is_relevant_ext = any(lowercase_filename.endswith(ext) for ext in [
            '.ts', '.js', '.html', '.scss', '.css', '.json', '.md', '.txt'
        ])

        # Prioritize important Angular patterns like components, services, etc.
        is_angular_key_file = any(pattern in lowercase_filename for pattern in [
            'component.ts', 'service.ts', 'module.ts', 'directive.ts',
            'pipe.ts', 'guard.ts', 'resolver.ts', 'interceptor.ts',
            'effects.ts', 'reducer.ts', 'actions.ts', 'selectors.ts',
            'store.ts', 'facade.ts', 'util.ts', 'model.ts', 'interface.ts',
            'enum.ts', 'constant.ts', 'config.ts', 'environment.ts',
            'route.ts', 'routing.ts', 'app.ts', 'main.ts', 'polyfills.ts'
        ])

        return is_relevant_ext and (
            # Always include key Angular files
                is_angular_key_file or
                # Include .html files for templates
                lowercase_filename.endswith('.html') or
                # Include style files
                any(lowercase_filename.endswith(ext) for ext in ['.scss', '.css']) or
                # Include important config files
                any(fname in lowercase_filename for fname in [
                    'angular.json', 'ionic.config.json', 'capacitor.config.json',
                    'package.json', 'tsconfig.json', 'environment.ts', 'routes.ts',
                    'index.html', 'global.scss', 'variables.scss'
                ])
        )
    elif app_type == "spring":
        # Spring Boot app file extensions
        return any(lowercase_filename.endswith(ext) for ext in [
            '.java', '.kt', '.xml', '.properties', '.yml', '.yaml', '.md', '.txt'
        ])

    return False


def detect_app_type(codebase_path: str) -> str:
    """
    Attempts to detect if the application is an Ionic or Spring Boot app.

    Args:
        codebase_path: Path to the code base folder

    Returns:
        'ionic' or 'spring' based on detection, defaults to 'spring' if unsure
    """
    # Check for Ionic/Angular specific files
    ionic_indicators = [
        'ionic.config.json',
        'angular.json',
        'package.json',
        'tsconfig.json',
        'capacitor.config.ts',
        'capacitor.config.json',
        'src/app/app.module.ts',
        'src/app/app-routing.module.ts',
        'src/app/app.component.ts',
        'src/main.ts'
    ]

    # Check for Spring Boot specific files
    spring_indicators = [
        'pom.xml',
        'build.gradle',
        'application.properties',
        'application.yml',
        'src/main/java',
        'src/main/resources',
        'src/test/java',
        'mvnw',
        'gradlew'
    ]

    # Count indicators for each type
    ionic_count = sum(1 for indicator in ionic_indicators
                      if os.path.exists(os.path.join(codebase_path, indicator)))

    spring_count = sum(1 for indicator in spring_indicators
                       if os.path.exists(os.path.join(codebase_path, indicator)))

    # Look for Angular component/service patterns as a strong indicator
    angular_patterns_found = False
    for root, _, files in os.walk(codebase_path):
        for file in files:
            if any(pattern in file.lower() for pattern in [
                'component.ts', 'service.ts', 'module.ts', 'page.ts'
            ]):
                angular_patterns_found = True
                break
        if angular_patterns_found:
            break

    # Determine app type based on indicator count and patterns
    if angular_patterns_found or ionic_count > spring_count:
        return "ionic"
    else:
        return "spring"


def should_ignore_based_on_gitignore(file_path: str, codebase_path: str) -> bool:
    """
    Simple implementation to check if a file should be ignored based on common
    patterns found in .gitignore files.

    Args:
        file_path: Path to the file to check
        codebase_path: Path to the code base folder

    Returns:
        True if the file should be ignored, False otherwise
    """
    # Common patterns found in .gitignore files
    common_ignore_patterns = [
        'node_modules/', 'dist/', 'build/', 'target/', '.git/',
        '.idea/', '.vscode/', '.DS_Store', '.env', '*.log',
        '*.tmp', 'tmp/', 'temp/', 'logs/', 'coverage/', '.gradle/',
        'bin/', 'obj/', '*.class', '*.jar', '*.war', 'out/',
        '*.min.js', '*.min.css', '*.pyc', '__pycache__/', 'venv/',
        'env/', '.env/', '.venv/', '*.swp', '.sass-cache/',
        'bower_components/', 'package-lock.json', 'yarn.lock',
        'Thumbs.db', '.project', '.classpath', '.settings/',
        '*.iml', '*.ipr', '*.iws'
    ]

    rel_path = os.path.relpath(file_path, codebase_path)
    rel_path = rel_path.replace('\\', '/')

    for pattern in common_ignore_patterns:
        # Exact match
        if rel_path == pattern:
            return True

        # Directory match (pattern ends with /)
        if pattern.endswith('/') and (rel_path.startswith(pattern) or rel_path + '/' == pattern):
            return True

        # File extension match (pattern starts with *.)
        if pattern.startswith('*.') and rel_path.endswith(pattern[1:]):
            return True

    return False


def find_source_files(codebase_path: str, app_type: str) -> List[str]:
    """
    Finds all relevant source files in the codebase directory,
    respecting common ignore patterns.

    Args:
        codebase_path: Path to the code base folder
        app_type: Either 'ionic' or 'spring'

    Returns:
        List of file paths for all relevant source files
    """
    source_files = []

    # Key directories that typically contain important source code
    priority_dirs = []
    if app_type == "ionic":
        priority_dirs = [
            os.path.join(codebase_path, "src", "app"),
            os.path.join(codebase_path, "src", "environments"),
            os.path.join(codebase_path, "src", "assets"),
            os.path.join(codebase_path, "src", "theme")
        ]
    elif app_type == "spring":
        priority_dirs = [
            os.path.join(codebase_path, "src", "main", "java"),
            os.path.join(codebase_path, "src", "main", "resources"),
            os.path.join(codebase_path, "src", "main", "kotlin")
        ]

    # First collect files from priority directories
    for priority_dir in priority_dirs:
        if os.path.exists(priority_dir):
            for root, _, files in os.walk(priority_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    if not should_ignore_based_on_gitignore(file_path, codebase_path) and is_relevant_file(file_path,
                                                                                                           app_type):
                        source_files.append(file_path)

    # Then collect remaining files from the entire codebase
    for root, _, files in os.walk(codebase_path):
        for file in files:
            file_path = os.path.join(root, file)
            # Skip if already added from priority dirs
            if file_path in source_files:
                continue
            if not should_ignore_based_on_gitignore(file_path, codebase_path) and is_relevant_file(file_path, app_type):
                source_files.append(file_path)

    return source_files


def generate_context(app_keys: List[str], app_configs: Dict[str, AppConfig], combined_output: bool = False) -> None:
    """
    Generates the context file for the specified app keys.

    Args:
        app_keys: List of keys for the app configurations to use
        app_configs: Dictionary of app configurations
        combined_output: Whether to combine all outputs into a single file
    """
    # If no app keys provided, process all available
    if not app_keys:
        app_keys = list(app_configs.keys())
        print(f"No app keys specified. Processing all: {', '.join(app_keys)}")

    # Validate all app keys
    invalid_keys = [key for key in app_keys if key not in app_configs]
    if invalid_keys:
        print(f"Error: The following app key(s) were not found in configurations: {', '.join(invalid_keys)}")
        return

    # Process each app key
    all_outputs = {}

    for app_key in app_keys:
        config = app_configs[app_key]

        # Check if the codebase path exists
        if not os.path.exists(config.codebase_path):
            print(f"Error: Codebase path '{config.codebase_path}' for app key '{app_key}' does not exist.")
            continue

        # Detect app type
        app_type = detect_app_type(config.codebase_path)
        print(f"App key '{app_key}': Detected app type: {app_type}")

        # Find all relevant source files
        source_files = find_source_files(config.codebase_path, app_type)
        print(f"App key '{app_key}': Found {len(source_files)} relevant source files (ignoring common patterns).")

        # Create individual output file
        if not combined_output:
            # Create output directory if it doesn't exist
            output_dir = os.path.dirname(config.output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)

            # Write all source files to the context file
            with open(config.output_path, 'w', encoding='utf-8') as context_file:
                # Add a header with summary information
                context_file.write(f"# Context for {app_key}\n")
                context_file.write(f"# App Type: {app_type}\n")
                context_file.write(f"# Generated: {os.path.basename(__file__)}\n")
                context_file.write(f"# Number of files: {len(source_files)}\n\n")

                for file_path in source_files:
                    relative_path = os.path.relpath(file_path, config.codebase_path)

                    # Write file name as header
                    context_file.write(f"\n\n# FILE: {relative_path}\n\n")

                    try:
                        # Read and write file content
                        with open(file_path, 'r', encoding='utf-8') as source_file:
                            context_file.write(source_file.read())
                    except UnicodeDecodeError:
                        context_file.write("# [Binary file or encoding not supported]\n")
                    except Exception as e:
                        context_file.write(f"# [Error reading file: {str(e)}]\n")

            print(f"App key '{app_key}': Context file generated at: {config.output_path}")
        else:
            # Collect output for the combined file
            output_content = f"# Context for {app_key}\n"
            output_content += f"# App Type: {app_type}\n"
            output_content += f"# Generated: {os.path.basename(__file__)}\n"
            output_content += f"# Number of files: {len(source_files)}\n\n"

            for file_path in source_files:
                relative_path = os.path.relpath(file_path, config.codebase_path)

                # Write file name as header
                output_content += f"\n\n# FILE: {relative_path}\n\n"

                try:
                    # Read and write file content
                    with open(file_path, 'r', encoding='utf-8') as source_file:
                        output_content += source_file.read()
                except UnicodeDecodeError:
                    output_content += "# [Binary file or encoding not supported]\n"
                except Exception as e:
                    output_content += f"# [Error reading file: {str(e)}]\n"

            all_outputs[app_key] = output_content

    # If combined output is requested, write all outputs to a single file
    if combined_output and all_outputs:
        combined_path = os.path.join(os.path.dirname(next(iter(app_configs.values())).output_path),
                                     "claude-context-combined.txt")

        with open(combined_path, 'w', encoding='utf-8') as combined_file:
            combined_file.write(f"# Combined Context for {', '.join(app_keys)}\n")
            combined_file.write(f"# Generated: {os.path.basename(__file__)}\n")
            combined_file.write(f"# Number of apps: {len(all_outputs)}\n\n")

            for app_key, content in all_outputs.items():
                combined_file.write(f"\n\n{'=' * 80}\n")
                combined_file.write(f"# APP KEY: {app_key}\n")
                combined_file.write(f"{'=' * 80}\n\n")
                combined_file.write(content)

        print(f"Combined context file generated at: {combined_path}")


def main():
    """
    Main function to parse arguments and execute the script.
    """
    parser = argparse.ArgumentParser(description='Generate context from app source code.')
    parser.add_argument('app_keys', nargs='*', help='One or more key names for the apps (e.g., account transaction)')
    parser.add_argument('--combined', '-c', action='store_true', help='Combine all outputs into a single file')

    args = parser.parse_args()
    app_configs = get_app_configs()

    generate_context(args.app_keys, app_configs, args.combined)


if __name__ == "__main__":
    main()
