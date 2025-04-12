
# !/usr/bin/env python3
# python3 claude_patch.py [app_key1] [app_key2] ... [app_keyN]
import os
import re
import sys
import argparse
from typing import Dict, List, Tuple

codebase_path = '/Users/rishighai/Desktop/finance-manager-application'
claude_code_output_base_path = '/Users/rishighai/Desktop/finance-manager-application/statement-loader/resources/claude'


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
            f"{claude_code_output_base_path}/claude-output-account.txt"
        ),
        "transaction": AppConfig(
            f"{codebase_path}/transaction-service",
            f"{claude_code_output_base_path}/claude-output-transaction.txt"
        ),
        "ui": AppConfig(
            f"{codebase_path}/finance-manager-ui",
            f"{claude_code_output_base_path}/claude-output-ui.txt"
        )
        # Add more app configurations as needed
    }


def extract_files_from_output(output_file_path: str) -> Dict[str, str]:
    """
    Extract file paths and their contents from the Claude output file.
    Enhanced to handle multiple file formats including JavaScript/TypeScript comments.

    Args:
        output_file_path: Path to Claude's output file

    Returns:
        Dictionary mapping file paths to their content (or None for files to delete)
    """
    file_contents = {}

    try:
        with open(output_file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Print first 500 chars for debugging
        print(f"First 500 chars of file:\n{content[:500]}...")

        # First try standard Java/Python file pattern with # FILE: marker
        file_sections = re.split(r'(?:\n|^)#\s*FILE\s*:\s*([^\n]+)(?:\n|$)', content)

        if len(file_sections) > 1:
            # First element is content before any file marker, skip it
            file_sections = file_sections[1:]

            # Now we have alternating [file_path, content, file_path, content, ...]
            for i in range(0, len(file_sections), 2):
                if i + 1 < len(file_sections):
                    file_path = file_sections[i].strip()
                    file_content = file_sections[i + 1]

                    # Check for delete marker
                    if file_path.lower().startswith('delete:'):
                        # Extract the actual file path after 'delete:'
                        real_path = file_path[7:].strip()
                        if real_path:
                            file_contents[real_path] = None  # Mark for deletion
                            print(f"File marked for deletion: {real_path}")
                    # Skip empty files
                    elif file_path and file_content:
                        file_contents[file_path] = file_content
                        print(f"Found file: {file_path} ({len(file_content)} bytes)")
        else:
            # Try JavaScript/TypeScript pattern with // src/ markers
            js_file_sections = re.split(r'(?:\n|^)//\s+([^\n]+\.(?:ts|js|html|scss|css))(?:\n|$)', content)

            if len(js_file_sections) > 1:
                # First element is content before any file marker, skip it
                js_file_sections = js_file_sections[1:]

                # Now we have alternating [file_path, content, file_path, content, ...]
                for i in range(0, len(js_file_sections), 2):
                    if i + 1 < len(js_file_sections):
                        file_path = js_file_sections[i].strip()

                        # Find the next file marker or end of content
                        if i + 2 < len(js_file_sections):
                            # There's another file after this one
                            next_marker_pos = content.find(f"// {js_file_sections[i + 2].strip()}",
                                                           content.find(f"// {file_path}") + len(file_path) + 3)
                            if next_marker_pos > 0:
                                file_content = content[content.find(f"// {file_path}") + len(
                                    file_path) + 3:next_marker_pos].strip()
                            else:
                                file_content = js_file_sections[i + 1]
                        else:
                            # This is the last file
                            file_content = js_file_sections[i + 1]

                        # Check for delete marker (unlikely with JS/TS format, but just in case)
                        if file_path.lower().startswith('delete:'):
                            real_path = file_path[7:].strip()
                            if real_path:
                                file_contents[real_path] = None  # Mark for deletion
                                print(f"File marked for deletion: {real_path}")
                        elif file_path and file_content:
                            file_contents[file_path] = file_content
                            print(f"Found JS/TS file: {file_path} ({len(file_content)} bytes)")
            else:
                # Try alternative pattern using backticks for code blocks
                code_blocks = re.findall(r'```.*?File\s*:\s*([^\n]+).*?```(.*?)(?=```|$)', content, re.DOTALL)

                if code_blocks:
                    for file_path, file_content in code_blocks:
                        file_path = file_path.strip()
                        file_content = file_content.strip()

                        # Check for delete marker
                        if file_path.lower().startswith('delete:'):
                            real_path = file_path[7:].strip()
                            if real_path:
                                file_contents[real_path] = None
                                print(f"File marked for deletion (alt method): {real_path}")
                        elif file_path and file_content:
                            file_contents[file_path] = file_content
                            print(f"Found file (alt method): {file_path} ({len(file_content)} bytes)")
                else:
                    # Try one more pattern for files with extensions in heading format
                    file_patterns = re.findall(
                        r'(?:^|\n)(?:#+ |)([A-Za-z0-9_\-./]+\.[A-Za-z0-9]+)(?:\n|:)(?:\n|)(```[^\n]*\n)?([^`#]*?)(?:\n```|(?=\n(?:#+ |)[A-Za-z0-9_\-./]+\.[A-Za-z0-9]+(?:\n|:))|\Z)',
                        content, re.DOTALL)

                    if file_patterns:
                        for file_path, _, file_content in file_patterns:
                            file_path = file_path.strip()
                            file_content = file_content.strip()

                            # Check for delete marker
                            if file_path.lower().startswith('delete:'):
                                real_path = file_path[7:].strip()
                                if real_path:
                                    file_contents[real_path] = None
                                    print(f"File marked for deletion (third method): {real_path}")
                            elif file_path and file_content:
                                file_contents[file_path] = file_content
                                print(f"Found file (third method): {file_path} ({len(file_content)} bytes)")

        # If no files found, try one last approach - manual extraction based on comment patterns
        if len(file_contents) == 0:
            print("Trying manual extraction based on comment patterns...")

            # For Angular/Ionic applications, common patterns would be:
            # // src/app/components/component-name/component-name.component.ts
            # // src/model/model-name.ts
            # // src/service/service-name.service.ts

            lines = content.split('\n')
            current_file = None
            current_content = []

            for line in lines:
                # Check if this line is a file path comment
                if line.startswith('// src/'):
                    # If we were already processing a file, save it
                    if current_file:
                        file_contents[current_file] = '\n'.join(current_content)
                        print(f"Found file (manual method): {current_file} ({len(file_contents[current_file])} bytes)")

                    # Start a new file
                    current_file = line[3:].strip()  # Remove the "// " prefix
                    current_content = []
                    # Add the current line as first line of content (keep the comment)
                    current_content.append(line)
                else:
                    # If we're currently processing a file, add this line to its content
                    if current_file:
                        current_content.append(line)

            # Don't forget to save the last file
            if current_file and current_content:
                file_contents[current_file] = '\n'.join(current_content)
                print(f"Found file (manual method): {current_file} ({len(file_contents[current_file])} bytes)")

    except Exception as e:
        print(f"Error parsing output file: {str(e)}")
        import traceback
        traceback.print_exc()

    return file_contents


def apply_patches(app_keys: List[str], app_configs: Dict[str, AppConfig], combined_report: bool = False) -> None:
    """
    Apply the patches from Claude's output to the codebase.

    Args:
        app_keys: List of keys for the app configurations to use
        app_configs: Dictionary of app configurations
        combined_report: Whether to generate a combined report
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
    all_reports = {}

    for app_key in app_keys:
        config = app_configs[app_key]

        # Check if the output file exists
        if not os.path.exists(config.output_path):
            print(f"Error: Output file '{config.output_path}' for app key '{app_key}' does not exist.")
            continue

        # Check if the codebase path exists
        if not os.path.exists(config.codebase_path):
            print(f"Error: Codebase path '{config.codebase_path}' for app key '{app_key}' does not exist.")
            continue

        # Extract files from output
        file_contents = extract_files_from_output(config.output_path)
        print(f"App key '{app_key}': Found {len(file_contents)} files in output")

        if len(file_contents) == 0:
            # If no files found with automatic parsing, prompt user for manual input
            print(
                f"\nAutomatic file detection failed for app key '{app_key}'. Would you like to manually specify a file?")
            manual_input = input("Enter 'y' to proceed, any other key to skip: ")

            if manual_input.lower() == 'y':
                file_path = input("Enter file path (relative to codebase root): ")

                if not file_path:
                    print("No file path provided. Skipping.")
                    continue

                action = input("Action (create/update/delete): ").lower()

                if action == "delete":
                    file_contents[file_path] = None
                    print(f"Added file '{file_path}' for deletion")
                else:
                    print("Enter file content (type '---END---' on a new line when finished):")
                    content_lines = []
                    while True:
                        line = input()
                        if line == "---END---":
                            break
                        content_lines.append(line + "\n")

                    if content_lines:
                        file_contents[file_path] = "".join(content_lines)
                        print(f"Added file '{file_path}' for {action}")
                    else:
                        print("No content provided. Skipping.")
                        continue

        # Apply each file
        files_created = 0
        files_updated = 0
        files_deleted = 0
        files_skipped = 0

        processed_files = []

        for rel_file_path, content in file_contents.items():
            # For Angular/Ionic files, we may need to clean up the file path
            # If the path starts with "src/", it's already relative
            # Otherwise, we assume it's a file in the src directory
            if not rel_file_path.startswith('src/') and (rel_file_path.endswith('.ts') or
                                                         rel_file_path.endswith('.js') or
                                                         rel_file_path.endswith('.html') or
                                                         rel_file_path.endswith('.scss') or
                                                         rel_file_path.endswith('.css')):
                rel_file_path = 'src/' + rel_file_path

            # Construct the absolute path
            abs_file_path = os.path.join(config.codebase_path, rel_file_path)

            # Check if this is a file to delete
            if content is None:
                if os.path.exists(abs_file_path):
                    try:
                        os.remove(abs_file_path)
                        print(f"DELETED: {rel_file_path}")
                        files_deleted += 1
                        processed_files.append(f"- DELETED: {rel_file_path}")
                    except Exception as e:
                        print(f"ERROR deleting '{rel_file_path}': {str(e)}")
                else:
                    print(f"Skipping deletion of '{rel_file_path}' (file does not exist)")
                    files_skipped += 1
                continue

            # Create the directory if it doesn't exist
            os.makedirs(os.path.dirname(abs_file_path), exist_ok=True)

            # Check if file exists
            if os.path.exists(abs_file_path):
                # Compare content before updating
                try:
                    with open(abs_file_path, 'r', encoding='utf-8') as f:
                        existing_content = f.read()

                    if existing_content == content:
                        print(f"Skipping '{rel_file_path}' (no changes)")
                        files_skipped += 1
                        continue
                except UnicodeDecodeError:
                    # If we can't read the file as text, assume it needs to be updated
                    print(f"Warning: Could not read '{rel_file_path}' as text. Assuming file needs update.")

                # Update the file
                with open(abs_file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"UPDATED: {rel_file_path}")
                files_updated += 1
                processed_files.append(f"- UPDATED: {rel_file_path}")
            else:
                # Create the file
                with open(abs_file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"CREATED: {rel_file_path}")
                files_created += 1
                processed_files.append(f"- CREATED: {rel_file_path}")

        # Generate individual report
        report = f"\nSummary for app key '{app_key}':\n"
        report += f"  - {files_created} files created\n"
        report += f"  - {files_updated} files updated\n"
        report += f"  - {files_deleted} files deleted\n"
        report += f"  - {files_skipped} files unchanged\n"

        if processed_files:
            report += "\nProcessed files:\n"
            for file_info in processed_files:
                report += f"{file_info}\n"

        print(report)
        all_reports[app_key] = report

    # If combined report is requested, write all reports to a single file
    if combined_report:
        combined_path = os.path.join(os.path.dirname(next(iter(app_configs.values())).output_path),
                                     "claude-patch-report.txt")

        with open(combined_path, 'w', encoding='utf-8') as combined_file:
            combined_file.write(f"# Combined Patch Report for {', '.join(app_keys)}\n")
            combined_file.write(f"# Generated: {os.path.basename(__file__)}\n")
            combined_file.write(f"# Number of apps: {len(all_reports)}\n\n")

            for app_key, report in all_reports.items():
                combined_file.write(f"\n\n{'=' * 80}\n")
                combined_file.write(f"# APP KEY: {app_key}\n")
                combined_file.write(f"{'=' * 80}\n\n")
                combined_file.write(report)

        print(f"Combined patch report generated at: {combined_path}")


def create_combined_script_output() -> None:
    """
    Creates a single file with the contents of both scripts.
    """
    # Get this script's file path
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define file paths for the scripts
    get_context_path = os.path.join(script_dir, "claude_get_context.py")
    patch_path = os.path.join(script_dir, "claude_patch.py")

    # Define output path for combined script
    combined_path = os.path.join(script_dir, "claude_scripts.txt")

    # Check if both scripts exist
    if not os.path.exists(get_context_path):
        print(f"Error: Could not find script at '{get_context_path}'")
        return

    if not os.path.exists(patch_path):
        print(f"Error: Could not find script at '{patch_path}'")
        return

    # Read the scripts
    try:
        with open(get_context_path, 'r', encoding='utf-8') as f:
            get_context_content = f.read()

        with open(patch_path, 'r', encoding='utf-8') as f:
            patch_content = f.read()

        # Write the combined file
        with open(combined_path, 'w', encoding='utf-8') as combined_file:
            combined_file.write("=" * 80 + "\n")
            combined_file.write("# FILE: claude_get_context.py\n")
            combined_file.write("=" * 80 + "\n\n")
            combined_file.write(get_context_content)

            combined_file.write("\n\n" + "=" * 80 + "\n")
            combined_file.write("# FILE: claude_patch.py\n")
            combined_file.write("=" * 80 + "\n\n")
            combined_file.write(patch_content)

        print(f"Combined script file generated at: {combined_path}")

    except Exception as e:
        print(f"Error creating combined script file: {str(e)}")


def main():
    """
    Main function to parse arguments and execute the script.
    """
    parser = argparse.ArgumentParser(description='Apply code patches from Claude output.')
    parser.add_argument('app_keys', nargs='*', help='One or more key names for the apps (e.g., account transaction)')
    parser.add_argument('--combined', '-c', action='store_true', help='Generate a combined report')
    parser.add_argument('--all-scripts', '-a', action='store_true',
                        help='Create a single file with the contents of both scripts')

    args = parser.parse_args()
    app_configs = get_app_configs()

    # If --all-scripts flag is set, create the combined script file
    if args.all_scripts:
        create_combined_script_output()

    apply_patches(args.app_keys, app_configs, args.combined)


if __name__ == "__main__":
    main()