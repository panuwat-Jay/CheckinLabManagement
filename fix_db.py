#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cklab_project.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Add missing columns to Computer table
    cursor.execute("""
        ALTER TABLE lab_management_computer 
        ADD COLUMN IF NOT EXISTS code_name VARCHAR(50) NULL
    """)
    print("✓ Added Computer.code_name column")
    
    cursor.execute("""
        ALTER TABLE lab_management_computer 
        ADD COLUMN IF NOT EXISTS installed_software JSONB NULL DEFAULT '[]'::jsonb
    """)
    print("✓ Added Computer.installed_software column")
    
    cursor.execute("""
        ALTER TABLE lab_management_computer 
        ADD COLUMN IF NOT EXISTS session_start TIMESTAMP NULL
    """)
    print("✓ Added Computer.session_start column")
    
    cursor.execute("""
        ALTER TABLE lab_management_computer 
        ADD COLUMN IF NOT EXISTS "current_user" VARCHAR(100) NULL
    """)
    print("✓ Added Computer.current_user column")
    
    cursor.execute("""
        ALTER TABLE lab_management_computer 
        ADD COLUMN IF NOT EXISTS pc_type VARCHAR(20) DEFAULT 'General'
    """)
    print("✓ Added Computer.pc_type column")
    
    # Add missing columns to Booking table
    cursor.execute("""
        ALTER TABLE lab_management_booking 
        ADD COLUMN IF NOT EXISTS pc_id INTEGER NULL
    """)
    print("✓ Added Booking.pc_id column")
    
    cursor.execute("""
        ALTER TABLE lab_management_booking 
        ADD COLUMN IF NOT EXISTS date DATE NULL
    """)
    print("✓ Added Booking.date column")
    
    cursor.execute("""
        ALTER TABLE lab_management_booking 
        ADD COLUMN IF NOT EXISTS start_time VARCHAR(5) NULL
    """)
    print("✓ Added Booking.start_time column")
    
    cursor.execute("""
        ALTER TABLE lab_management_booking 
        ADD COLUMN IF NOT EXISTS end_time VARCHAR(5) NULL
    """)
    print("✓ Added Booking.end_time column")
    
    cursor.execute("""
        ALTER TABLE lab_management_booking 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'
    """)
    print("✓ Added Booking.status column")
    
    cursor.execute("""
        ALTER TABLE lab_management_booking 
        ADD COLUMN IF NOT EXISTS note TEXT NULL
    """)
    print("✓ Added Booking.note column")
    
    # Add missing columns to UsageLog table
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'Guest'
    """)
    print("✓ Added UsageLog.user_role column")
    
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS user_faculty VARCHAR(100) DEFAULT '-'
    """)
    print("✓ Added UsageLog.user_faculty column")
    
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS user_level VARCHAR(50) DEFAULT '-'
    """)
    print("✓ Added UsageLog.user_level column")
    
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS user_year VARCHAR(50) DEFAULT '-'
    """)
    print("✓ Added UsageLog.user_year column")
    
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS used_software JSONB NULL DEFAULT '[]'::jsonb
    """)
    print("✓ Added UsageLog.used_software column")
    
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS is_ai_used BOOLEAN DEFAULT FALSE
    """)
    print("✓ Added UsageLog.is_ai_used column")
    
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS slot_id VARCHAR(50) DEFAULT 'Unlimited'
    """)
    print("✓ Added UsageLog.slot_id column")
    
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS details TEXT DEFAULT ''
    """)
    print("✓ Added UsageLog.details column")
    
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER NULL
    """)
    print("✓ Added UsageLog.satisfaction_score column")
    
    cursor.execute("""
        ALTER TABLE lab_management_usagelog 
        ADD COLUMN IF NOT EXISTS comment TEXT DEFAULT ''
    """)
    print("✓ Added UsageLog.comment column")

print("\nDatabase schema updated successfully!")
