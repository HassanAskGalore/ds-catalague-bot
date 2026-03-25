"""
Test Camelot table extraction
"""

import sys
sys.path.insert(0, '.')

from ingestion.parser import CatalogueParser

print("=" * 70)
print("CAMELOT TABLE EXTRACTION TEST")
print("=" * 70)
print()

# Initialize parser
print("Initializing Camelot parser...")
parser = CatalogueParser()
print()

# Parse PDF
print("Parsing DS-Catalogue.pdf...")
print("This will extract both text and tables...")
print()

result = parser.parse("DS-Catalogue.pdf")

print()
print("=" * 70)
print("RESULTS")
print("=" * 70)
print(f"Total pages: {result['total_pages']}")
print(f"Tables extracted: {len(result['structured']['tables'])}")
print(f"Markdown length: {len(result['markdown'])} characters")
print()

# Show table details
if result['structured']['tables']:
    print("Table Details:")
    print("-" * 70)
    for i, table in enumerate(result['structured']['tables'], 1):
        print(f"\nTable {i}:")
        print(f"  Page: {table['page']}")
        print(f"  Mode: {table['mode']}")
        print(f"  Accuracy: {table['accuracy']:.1f}%")
        print(f"  Shape: {table['dataframe'].shape[0]} rows x {table['dataframe'].shape[1]} columns")
        
        # Show first few rows
        if not table['dataframe'].empty:
            print(f"\n  First 3 rows:")
            print(table['dataframe'].head(3).to_string(index=False))
        
        if i >= 5:  # Show only first 5 tables
            print(f"\n... and {len(result['structured']['tables']) - 5} more tables")
            break

print()
print("=" * 70)
print("✓ Camelot is working!")
print("=" * 70)
