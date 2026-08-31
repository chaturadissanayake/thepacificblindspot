import pandas as pd
import json

# 1. Load your flat data
print("Reading Excel file...")
df = pd.read_excel('clean_weather.xlsx')

# 2. Rename the columns to make your JavaScript variables clean
df = df.rename(columns={
    'Pacific Island Countries and territories': 'Country',
    'METEO_STATION_TYPE': 'StationType',
    'TIME_PERIOD': 'Year',
    'OBS_VALUE': 'Stations'
})

# 3. Convert the data to a list of dictionaries
json_data = df.to_dict(orient='records')

# 4. Format it as a JavaScript file
print("Writing data.js...")
js_content = f"const weatherData = {json.dumps(json_data, indent=2)};"

# 5. Save the file
with open('data.js', 'w') as file:
    file.write(js_content)

print("Success! Your data.js file is ready.")