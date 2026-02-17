#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cklab_project.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Add missing columns to UsageLog
    print("Adding pc_id column to UsageLog...")
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS pc_id INTEGER NULL
    """)
    print("✓ Added pc_id column")
    
    print("Adding action column to UsageLog...")
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS action VARCHAR(50) NULL
    """)
    print("✓ Added action column")
    
    print("Adding duration_minutes column to UsageLog...")
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0
    """)
    print("✓ Added duration_minutes column")
    
    print("Adding timestamp column to UsageLog...")
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    """)
    print("✓ Added timestamp column")
    
    # Make computer_id nullable too
    print("Making computer_id nullable in UsageLog...")
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ALTER COLUMN computer_id DROP NOT NULL
    """)
    print("✓ Made computer_id nullable")

print("\nUsageLog table updated successfully!")
