import pandas as pd

df = pd.read_csv("kidney_disease.csv")

# Clean whitespace and quotation marks
for col in df.columns:
    df[col] = df[col].apply(
        lambda x: x.strip().strip("'\"") if isinstance(x, str) else x
    )

# Replace missing-value markers
df.replace(["?", "", "nan", "NaN"], pd.NA, inplace=True)

# Numerical columns
numeric_cols = [
    "age", "bp", "sg", "al", "su",
    "bgr", "bu", "sc", "sod", "pot",
    "hemo", "pcv", "wbcc", "rbcc"
]

# Convert numerical columns
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Save cleaned dataset
df.to_csv("kidney_disease_cleaned.csv", index=False)

print("Updated data types:")
print(df.dtypes)

print("\nMissing values:")
print(df.isnull().sum())

print("\nDataset shape:", df.shape)