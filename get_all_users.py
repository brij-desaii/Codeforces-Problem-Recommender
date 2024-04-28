import requests

# Define the URL of the API endpoint you want to call
url = "https://codeforces.com/api/user.ratedList?activeOnly=true&includeRetired=false"

# Make a GET request to the API endpoint
response = requests.get(url)

# Check if the request was successful (status code 200)
if response.status_code == 200:
    # Open a file in binary write mode
    with open("cfusers.json", "wb") as f:
        # Write the content of the response to the file
        f.write(response.content)
    print("Response saved successfully.")
else:
    # If the request was not successful, print the error status code
    print("Error:", response.status_code)
