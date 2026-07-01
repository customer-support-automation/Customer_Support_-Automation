# Install language detection library
!pip install langdetect

import pandas as pd
import re
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

# For reproducibility
DetectorFactory.seed = 42

# =========================
# LOAD ALL DATASETS
# =========================
df1 = pd.read_csv('dataset-tickets-multi-lang3-4k.csv')
df2 = pd.read_csv('dataset-tickets-multi-lang-4-20k.csv')
df3 = pd.read_csv('aa_dataset-tickets-multi-lang-5-2-50-version.csv')

# =========================
# STANDARDIZE COLUMN NAMES
# Update these according to each dataset
# =========================

df1 = df1.rename(columns={
    'subject': 'title',
    'body': 'description',
    'resolution': 'response'
})

df2 = df2.rename(columns={
    'ticket_title': 'title',
    'ticket_description': 'description',
    'answer': 'response'
})

df3 = df3.rename(columns={
    'title': 'title',
    'description': 'description',
    'response': 'response'
})

# Keep only required columns
df1 = df1[['title', 'description', 'response']]
df2 = df2[['title', 'description', 'response']]
df3 = df3[['title', 'description', 'response']]

# =========================
# MERGE DATASETS
# =========================

df = pd.concat([df1, df2, df3], ignore_index=True)

print("Merged Shape:", df.shape)

# =========================
# REMOVE EMPTY ROWS
# =========================

df = df.dropna(subset=['title', 'description', 'response'])

# =========================
# CLEAN TEXT
# =========================

def clean_text(text):
    if not isinstance(text, str):
        return ""

    text = text.replace('\\n', ' ')
    text = text.replace('\n', ' ')
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'<.*?>', '', text)  # remove HTML tags
    return text.strip()

df['title'] = df['title'].apply(clean_text)
df['description'] = df['description'].apply(clean_text)
df['response'] = df['response'].apply(clean_text)

# =========================
# KEEP ONLY ENGLISH ROWS
# =========================

def is_english(text):
    try:
        return detect(str(text)) == 'en'
    except LangDetectException:
        return False

print("Detecting language...")

mask = (
    df['title'].apply(is_english) &
    df['description'].apply(is_english) &
    df['response'].apply(is_english)
)

df = df[mask]

print("After English filtering:", df.shape)

# =========================
# REMOVE DUPLICATES
# =========================

df = df.drop_duplicates(
    subset=['title', 'description']
)

print("After duplicate removal:", df.shape)

# =========================
# TRUNCATE LONG TEXT
# =========================

df['description'] = df['description'].str[:1000]
df['response'] = df['response'].str[:500]

# =========================
# RESET INDEX
# =========================

df = df.reset_index(drop=True)

print(df.head())

# =========================
# SAVE FINAL DATASET
# =========================

df.to_csv('/content/dataset_clean.csv', index=False)

print("Saved dataset_clean.csv")
print("Final Rows:", len(df))