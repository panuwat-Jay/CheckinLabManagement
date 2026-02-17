#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cklab_project.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Convert start_time and end_time from TIMESTAMP to VARCHAR(5)
    print("Converting start_time column from TIMESTAMP to VARCHAR...")
    cursor.execute("""
        ALTER TABLE lab_management_booking 
        DROP COLUMN start_time CASCADE,
        ADD COLUMN start_time VARCHAR(5) NULL
    """)
    print("✓ Converted start_time to VARCHAR(5)")
    
    print("Converting end_time column from TIMESTAMP to VARCHAR...")
    cursor.execute("""
        ALTER TABLE lab_management_booking 
        DROP COLUMN end_time CASCADE,
        ADD COLUMN end_time VARCHAR(5) NULL
    """)
    print("✓ Converted end_time to VARCHAR(5)")

print("\nBooking table schema updated successfully!")
