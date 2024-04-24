import csv
import json

# Load JSON data
with open('checkpoints/checkpoint_2200.json') as f:
    data = json.load(f)

# Extract user information
users = data['eligibleUsers']

# Define CSV file path
csv_file = 'users_problems.csv'

# Open CSV file in write mode
with open(csv_file, 'w', newline='') as f:
    # Create a CSV writer object
    writer = csv.writer(f)
    
    # Write header row
    writer.writerow(['user_handle', 'problem_id', 'timestamp'])
    
    # Iterate over users
    for user in users:
        handle = user['handle']
        problems = user['problems']
        
        # Iterate over problems of the user
        for problem in problems:
            writer.writerow([handle, problem[0], problem[1]])

print("CSV file generated successfully!")