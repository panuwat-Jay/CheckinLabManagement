#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cklab_project.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Check existing columns
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'lab_management_booking' 
        ORDER BY ordinal_position
    """)
    print("Current Booking columns:")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
    
    print("\nCurrent Computer columns:")
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'lab_management_computer' 
        ORDER BY ordinal_position
    """)
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
