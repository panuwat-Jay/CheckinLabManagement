#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cklab_project.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Make computer_id nullable
    print("Making computer_id nullable...")
    cursor.execute("""
        ALTER TABLE lab_management_booking 
        ALTER COLUMN computer_id DROP NOT NULL
    """)
    print("✓ Made computer_id nullable")

print("\nBooking table updated successfully!")
