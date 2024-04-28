import csv
import json

# Load JSON data
with open('checkpoints/checkpoint_12600.json') as f:
    data = json.load(f)

# Extract user information
users = data['eligibleUsers']

# Define CSV file path
csv_file1 = 'data/newbie_to_pupil/user_problem.csv'
csv_file2 = 'data/newbie_to_pupil/user_tags.csv'
csv_file3 = "data/newbie_to_pupil/user_ratings.csv"

# Open CSV file in write mode
with open(csv_file1, 'w', newline='') as f:
    # Create a CSV writer object
    writer = csv.writer(f)
    
    # Write header row
    writer.writerow(['user_handle', 'problem_id', 'timestamp', 'problem_rating', 'problem_tags'])
    
    # Iterate over users
    for user in users:
        handle = user['handle']
        problems = user['problems']
        
        # Iterate over problems of the user
        for problem in problems:
            writer.writerow([handle, problem[0], problem[1], problem[2], problem[3]])

print("user_problem file generated successfully!")

for user in users:
    user['tagFreq']['0user_handle'] = user['handle']
    user['ratingFreq']['0user_handle'] = user['handle']

list_of_dicts = [user['tagFreq'] for user in users]
# Extract all unique tags from all dictionaries
all_tags = set().union(*(d.keys() for d in list_of_dicts))

# Sort the tags alphabetically
sorted_tags = sorted(all_tags)

# Open the output file in write mode
with open(csv_file2, 'w', newline='') as csvfile:
    # Create a CSV writer object
    writer = csv.DictWriter(csvfile, fieldnames=sorted_tags)

    # Write the header row with field names
    writer.writeheader()

    # Iterate over each dictionary in the list
    for d in list_of_dicts:
        # Create a new dictionary with all keys initialized to None
        row_data = {key: d.get(key, None) for key in sorted_tags}
        
        # Write the row to the CSV file
        writer.writerow(row_data)
    

print("user_tags file generated successfully!")

list_of_dicts = [user['ratingFreq'] for user in users]
# Extract all unique tags from all dictionaries
all_tags = set().union(*(d.keys() for d in list_of_dicts))

# Sort the tags alphabetically
sorted_tags = sorted(all_tags)

# Open the output file in write mode
with open(csv_file3, 'w', newline='') as csvfile:
    # Create a CSV writer object
    writer = csv.DictWriter(csvfile, fieldnames=sorted_tags)

    # Write the header row with field names
    writer.writeheader()

    # Iterate over each dictionary in the list
    for d in list_of_dicts:
        # Create a new dictionary with all keys initialized to None
        row_data = {key: d.get(key, None) for key in sorted_tags}
        
        # Write the row to the CSV file
        writer.writerow(row_data)
    

print("user_ratings file generated successfully!")