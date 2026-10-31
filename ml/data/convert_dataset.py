import pandas as pd
import csv

file_path = "chronic_kidney_disease_full.arff"

with open(file_path, "r", encoding="utf-8") as file:
    lines = file.readlines()

# Extract column names
columns = []

for line in lines:
    line = line.strip()

    if line.lower().startswith("@attribute"):
        columns.append(line.split()[1].strip("'\""))

    if line.lower() == "@data":
        break

# Find data section
data_index = next(
    i for i, line in enumerate(lines)
    if line.strip().lower() == "@data"
)

rows = []

for line in lines[data_index + 1:]:
    line = line.strip()

    if not line or line.startswith("%"):
        continue

    try:
        row = next(csv.reader([line], skipinitialspace=True))
        if len(row) == len(columns):
            rows.append(row)
        else:
            print("Skipped malformed row:", line)
    except Exception as e:
        print("Error:", e)

df = pd.DataFrame(rows, columns=columns)

df.to_csv("kidney_disease.csv", index=False)

print("Conversion completed!")
print("Dataset shape:", df.shape)
print(df.head())