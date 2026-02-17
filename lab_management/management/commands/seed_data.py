from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta, time
from lab_management.models import Computer, Booking, UsageLog
import random


class Command(BaseCommand):
    help = 'Seed database with sample computer data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            Computer.objects.all().delete()
            Booking.objects.all().delete()
            UsageLog.objects.all().delete()
            self.stdout.write(self.style.WARNING('Cleared all existing data'))

        # Create 3 computers
        computers_data = [
            {
                'pc_id': '1',
                'name': 'Workstation Alpha',
                'code_name': 'Alpha',
                'status': 'available',
                'pc_type': 'Workstation',
                'installed_software': [
                    'Adobe Photoshop 2024',
                    'Blender 4.0',
                    'Python 3.11 IDE',
                    'Visual Studio Code',
                    'CUDA Toolkit (GPU)'
                ]
            },
            {
                'pc_id': '2',
                'name': 'Server Beta',
                'code_name': 'Beta',
                'status': 'in_use',
                'pc_type': 'Server',
                'current_user': 'นายสมชาย ใจดี',
                'session_start': timezone.now() - timedelta(minutes=45),
                'installed_software': [
                    'Database Server MySQL 8.0',
                    'Node.js 18',
                    'Docker',
                    'Git'
                ]
            },
            {
                'pc_id': '3',
                'name': 'Lab Machine Gamma',
                'code_name': 'Gamma',
                'status': 'reserved',
                'pc_type': 'General',
                'current_user': 'นางสาวนิดา วรรณสม',
                'installed_software': [
                    'MATLAB R2023b',
                    'Jupyter Notebook',
                    'TensorFlow 2.13',
                    'Python Data Science Stack'
                ]
            }
        ]

        created_computers = []
        for comp_data in computers_data:
            computer, created = Computer.objects.get_or_create(
                pc_id=comp_data['pc_id'],
                defaults={
                    'name': comp_data['name'],
                    'code_name': comp_data.get('code_name'),
                    'status': comp_data['status'],
                    'pc_type': comp_data['pc_type'],
                    'current_user': comp_data.get('current_user'),
                    'session_start': comp_data.get('session_start'),
                    'installed_software': comp_data['installed_software']
                }
            )
            created_computers.append(computer)
            status_str = "Created" if created else "Already exists"
            self.stdout.write(self.style.SUCCESS(f'{status_str}: {computer.name}'))

        # Create bookings for today and tomorrow
        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)

        bookings_data = [
            {
                'user_name': 'นายสมชาย ใจดี',
                'pc_id': 1,
                'date': today,
                'start_time': '09:00',
                'end_time': '11:00',
                'status': 'approved'
            },
            {
                'user_name': 'นางสาวนิดา วรรณสม',
                'pc_id': 3,
                'date': today,
                'start_time': '14:00',
                'end_time': '16:00',
                'status': 'approved'
            },
            {
                'user_name': 'นายวินัย สัมมา',
                'pc_id': 2,
                'date': today,
                'start_time': '10:30',
                'end_time': '12:30',
                'status': 'pending'
            },
            {
                'user_name': 'นางสาวรัญญา ศรีสวาง',
                'pc_id': 1,
                'date': tomorrow,
                'start_time': '13:00',
                'end_time': '15:00',
                'status': 'pending'
            }
        ]

        for booking_data in bookings_data:
            booking, created = Booking.objects.get_or_create(
                user_name=booking_data['user_name'],
                pc_id=booking_data['pc_id'],
                date=booking_data['date'],
                defaults={
                    'start_time': booking_data['start_time'],
                    'end_time': booking_data['end_time'],
                    'status': booking_data['status']
                }
            )
            status_str = "Created" if created else "Already exists"
            self.stdout.write(self.style.SUCCESS(
                f'{status_str}: Booking {booking.user_name} - PC{booking.pc_id} ({booking.date})'
            ))

        # Create usage logs for today
        logs_data = [
            {
                'user_id': '6201234567',
                'user_name': 'นายสมชาย ใจดี',
                'user_role': 'Student',
                'user_faculty': 'Faculty of Science',
                'user_level': 'Junior',
                'user_year': '3',
                'pc_id': 1,
                'action': 'START_SESSION',
                'start_time': timezone.now() - timedelta(hours=2, minutes=30),
                'duration_minutes': 150,
                'used_software': ['Python 3.11 IDE', 'Visual Studio Code'],
                'is_ai_used': False,
                'details': 'Lab work on project',
                'slot_id': 'Unlimited'
            },
            {
                'user_id': '6201234568',
                'user_name': 'นางสาวนิดา วรรณสม',
                'user_role': 'Student',
                'user_faculty': 'Faculty of Engineering',
                'user_level': 'Senior',
                'user_year': '4',
                'pc_id': 3,
                'action': 'START_SESSION',
                'start_time': timezone.now() - timedelta(hours=1, minutes=15),
                'duration_minutes': 0,  # Still active
                'used_software': ['MATLAB R2023b', 'TensorFlow 2.13'],
                'is_ai_used': True,
                'details': 'AI training session',
                'slot_id': 'Unlimited'
            },
            {
                'user_id': '6201234569',
                'user_name': 'นายวินัย สัมมา',
                'user_role': 'Student',
                'user_faculty': 'Faculty of IT',
                'user_level': 'Sophomore',
                'user_year': '2',
                'pc_id': 2,
                'action': 'START_SESSION',
                'start_time': timezone.now() - timedelta(minutes=45),
                'duration_minutes': 0,  # Still active
                'used_software': ['Database Server MySQL 8.0', 'Git'],
                'is_ai_used': False,
                'details': 'Database project work',
                'slot_id': 'Unlimited'
            }
        ]

        for log_data in logs_data:
            log = UsageLog.objects.create(**log_data)
            self.stdout.write(self.style.SUCCESS(
                f'Created: UsageLog {log.user_name} - PC{log.pc_id}'
            ))

        self.stdout.write(self.style.SUCCESS(
            '\nSuccessfully seeded database with sample data!'
        ))
