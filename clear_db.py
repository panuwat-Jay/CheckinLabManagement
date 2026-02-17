#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cklab_project.settings')
django.setup()

from lab_management.models import Computer, Booking, UsageLog

# Clear existing data
print("Clearing existing data...")
Booking.objects.all().delete()
UsageLog.objects.all().delete()
Computer.objects.all().delete()

print("✓ Data cleared. Ready for fresh seed.")
