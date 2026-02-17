# API endpoints that serve data for admin-monitor.js and related JavaScript
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Computer, Booking, UsageLog
from django.utils import timezone
from datetime import datetime, date, timedelta
import json


@method_decorator(csrf_exempt, name='dispatch')
class ApiComputerListView(View):
    """API endpoint: GET /api/admin/computers-list/
    Returns all computers with their current status, users, and installed software.
    """
    def get(self, request):
        computers = Computer.objects.all().values(
            'id', 'pc_id', 'name', 'code_name', 'status', 'pc_type', 
            'current_user', 'session_start', 'installed_software'
        )
        return JsonResponse({'data': list(computers)})


@method_decorator(csrf_exempt, name='dispatch')
class ApiBookingListView(View):
    """API endpoint: GET /api/admin/bookings-list/?date=YYYY-MM-DD
    Returns all bookings for the specified date (or today if not provided).
    """
    def get(self, request):
        date_str = request.GET.get('date', date.today().isoformat())
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except:
            target_date = date.today()
        
        bookings = Booking.objects.filter(date=target_date).values(
            'id', 'user_name', 'pc_id', 'date', 'start_time', 'end_time', 'status'
        )
        return JsonResponse({'data': list(bookings)})


@method_decorator(csrf_exempt, name='dispatch')
class ApiUsageLogListView(View):
    """API endpoint: GET /api/admin/logs-list/?date=YYYY-MM-DD
    Returns all usage logs for the specified date (or today if not provided).
    """
    def get(self, request):
        date_str = request.GET.get('date', date.today().isoformat())
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except:
            target_date = date.today()
        
        # Filter logs starting on that date
        logs = UsageLog.objects.filter(
            start_time__date=target_date
        ).values(
            'id', 'user_name', 'pc_id', 'action', 'start_time', 'timestamp',
            'duration_minutes', 'used_software', 'is_ai_used', 'details'
        )
        return JsonResponse({'data': list(logs)})


@method_decorator(csrf_exempt, name='dispatch')
class ApiUpdateComputerStatusView(View):
    """API endpoint: POST /api/admin/update-pc-status/
    Update computer status (available/in_use/reserved/maintenance)
    
    POST data: {
        "pc_id": 1,
        "status": "in_use",
        "current_user": "User Name"
    }
    """
    def post(self, request):
        try:
            data = json.loads(request.body)
            pc_id = data.get('pc_id')
            status = data.get('status')
            current_user = data.get('current_user')
            
            computer = Computer.objects.get(id=pc_id)
            computer.status = status
            if current_user:
                computer.current_user = current_user
                if status == 'in_use':
                    computer.session_start = timezone.now()
            else:
                computer.current_user = None
                computer.session_start = None
            computer.save()
            
            return JsonResponse({'success': True, 'message': 'Status updated'})
        except Computer.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Computer not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class ApiCreateLogView(View):
    """API endpoint: POST /api/admin/create-log/
    Create a new usage log entry (start or end session).
    
    POST data: {
        "action": "START_SESSION" | "END_SESSION",
        "user_id": "...",
        "user_name": "...",
        "user_role": "Student",
        "user_faculty": "...",
        "user_level": "...",
        "user_year": "...",
        "pc_id": 1,
        "start_time": "2026-02-17T12:00:00",
        "used_software": [...],
        "is_ai_used": true/false,
        "duration_minutes": 30,
        "details": "...",
        "satisfaction_score": 5,
        "comment": "..."
    }
    """
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            log = UsageLog.objects.create(
                user_id=data.get('user_id', 'Unknown'),
                user_name=data.get('user_name', 'Unknown'),
                user_role=data.get('user_role', 'Guest'),
                user_faculty=data.get('user_faculty', '-'),
                user_level=data.get('user_level', '-'),
                user_year=data.get('user_year', '-'),
                pc_id=data.get('pc_id'),
                action=data.get('action', 'START_SESSION'),
                start_time=datetime.fromisoformat(data.get('start_time', timezone.now().isoformat())),
                duration_minutes=data.get('duration_minutes', 0),
                used_software=data.get('used_software', []),
                is_ai_used=data.get('is_ai_used', False),
                slot_id=data.get('slot_id', 'Unlimited'),
                details=data.get('details', ''),
                satisfaction_score=data.get('satisfaction_score'),
                comment=data.get('comment', '')
            )
            
            return JsonResponse({'success': True, 'id': log.id})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class ApiUpdateBookingStatusView(View):
    """API endpoint: POST /api/admin/update-booking-status/
    Update booking status (pending/approved/completed/no_show/cancelled)
    
    POST data: {
        "booking_id": 1,
        "status": "completed"
    }
    """
    def post(self, request):
        try:
            data = json.loads(request.body)
            booking_id = data.get('booking_id')
            status = data.get('status')
            
            booking = Booking.objects.get(id=booking_id)
            booking.status = status
            booking.save()
            
            return JsonResponse({'success': True, 'message': 'Booking status updated'})
        except Booking.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Booking not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
