import json
import sys
from binarytree import Node

def readJsonFile(file_path):
    # Check if the file has a .json extension
    if not file_path.lower().endswith('.json'):
        print("File does not have a .json extension.")
        return None
    
    try:
        # Attempt to open and parse the file as JSON
        with open(file_path, 'r') as file:
            data = json.load(file)  # Load and parse the JSON file
        return data  # Return the parsed JSON object
    
    except json.JSONDecodeError:
        print("File contains invalid JSON.")
        return None
    
    except FileNotFoundError:
        print("File not found.")
        return None


def build_tree_from_json(data):
    if data is None:
        return None

    # Create the root node with the 'value'
    root = Node(data['value'])
    
    # Recursively create left and right children, if they exist
    if 'left' in data:
        root.left = build_tree_from_json(data['left'])
    if 'right' in data:
        root.right = build_tree_from_json(data['right'])

    return root


def main():
    if len(sys.argv) < 2:
        print("Usage: python tree.py path_to_your_file.json")
        sys.exit(1)  # Exit if no file path is provided

    file_path = sys.argv[1]  # Get the file path from command-line arguments
    data = readJsonFile(file_path)
    tree = build_tree_from_json(data)
    print(tree)


if __name__ == "__main__":
    main()