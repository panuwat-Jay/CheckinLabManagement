import csv
import json
import base64
import requests

from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.utils import timezone
from django.views import View
from django.views.generic import TemplateView
from .models import Booking, Computer, SiteConfig, Software, Status, UsageLog

# --- Helper Function for UBU API ---
def verify_ubu_user(user_id):
    """
    ตรวจสอบข้อมูลผู้ใช้จาก UBU API
    Ref: Doc API DSSI Project (Page 1-2)
    """
    url = "https://esapi.ubu.ac.th/api/v1/student/reg-data"
    
    # Encode user_id to Base64
    try:
        encoded_id = base64.b64encode(user_id.encode('utf-8')).decode('utf-8')
    except Exception as e:
        print(f"Encoding Error: {e}")
        return None

    payload = json.dumps({
        "loginName": encoded_id
    })
    
    headers = {
        'Content-Type': 'application/json'
    }

    try:
        # Timeout 5 วินาที ป้องกันเว็บค้างถ้าระบบมหาลัยล่ม
        response = requests.post(url, headers=headers, data=payload, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            # ตรวจสอบว่ามี field 'data' ตามโครงสร้างใน PDF หน้า 1
            if 'data' in data and data['data']:
                user_info = data['data'][0]
                
                # ประกอบชื่อ-สกุล (ภาษาไทย)
                prefix = user_info.get('USERPREFIXNAME', '')
                fname = user_info.get('USERNAME', '')
                lname = user_info.get('USERSURNAME', '')
                full_name = f"{prefix}{fname} {lname}".strip()
                
                return {
                    'is_valid': True,
                    'user_id': user_id,
                    'name': full_name,
                    'faculty': user_info.get('FACULTYNAME', ''),
                    'user_type': user_info.get('USERTYPE', 'Student')
                }
    except requests.exceptions.RequestException as e:
        print(f"API Connection Error: {e}")
    
    return None


# --- User / Kiosk Side (ปภังกร) ---

class IndexView(View):
    def get(self, request):
        # 1. จำลองเครื่อง (ในการใช้งานจริงต้องระบุ ID ถาวรของเครื่องนั้น)
        pc_id = "1"
        computer, created = Computer.objects.get_or_create(
            pc_id=pc_id, 
            defaults={'name': 'PC-1', 'status': 'available', 'pc_type': 'General'}
        )
        
        # 2. Config
        config = SiteConfig.objects.first()
        if not config:
            config = SiteConfig.objects.create(lab_name="CKLab Computer Center")

        # 3. Redirect ถ้ามี Session ค้างอยู่
        if computer.status == 'in_use' and 'session_pc_id' in request.session:
            return redirect('timer')

        context = {
            'computer': computer,
            'config': config
        }
        return render(request, 'cklab/kiosk/index.html', context)

    def post(self, request):
        # รับค่าจากฟอร์ม
        user_id = request.POST.get('user_id')
        user_name = request.POST.get('user_name') # ชื่อที่ส่งมาจาก Frontend (หรือ Hidden Form)
        user_type = request.POST.get('user_type', 'internal')

        if not user_id:
            return redirect('index')
        
        # Validation เพิ่มเติม: ถ้าเป็น internal ให้ลองเช็ค API อีกรอบเพื่อความชัวร์ (Optional)
        # แต่ถ้า Frontend เช็คมาแล้ว ก็สามารถเชื่อข้อมูล user_name ที่ส่งมาได้ระดับหนึ่ง
        # เพื่อความรวดเร็วในการ Check-in เราจะบันทึกเลย

        pc_id = "1"
        computer = get_object_or_404(Computer, pc_id=pc_id)
        
        # Update Computer Status
        computer.status = 'in_use'
        computer.current_user = user_name
        computer.session_start = timezone.now()
        computer.save()

        # Create Server Session
        request.session['session_pc_id'] = pc_id
        request.session['session_user_id'] = user_id
        request.session['session_user_name'] = user_name
        request.session['session_start_time'] = computer.session_start.isoformat()

        return redirect('timer')

# --- API สำหรับ Frontend เรียกตรวจสอบชื่อ (AJAX) ---
class ApiVerifyUserView(View):
    def get(self, request):
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'message': 'User ID required'}, status=400)
        
        # เรียก Helper Function
        result = verify_ubu_user(user_id)
        
        if result:
            return JsonResponse({
                'success': True,
                'data': result
            })
        else:
            return JsonResponse({
                'success': False, 
                'message': 'ไม่พบข้อมูล หรือการเชื่อมต่อมีปัญหา'
            }, status=404)

class ConfirmView(TemplateView):
    template_name = 'cklab/kiosk/confirm.html'

class TimerView(View):
    def get(self, request):
        pc_id = request.session.get('session_pc_id')
        if not pc_id:
            return redirect('index')
            
        computer = get_object_or_404(Computer, pc_id=pc_id)
        
        if computer.status != 'in_use':
            request.session.flush()
            return redirect('index')

        context = {
            'computer': computer,
            'user_name': request.session.get('session_user_name'),
            'start_time': request.session.get('session_start_time')
        }
        return render(request, 'cklab/kiosk/timer.html', context)

class FeedbackView(View):
    def get(self, request):
        return render(request, 'cklab/kiosk/feedback.html')

    def post(self, request):
        pc_id = request.session.get('session_pc_id')
        user_id = request.session.get('session_user_id')
        user_name = request.session.get('session_user_name')
        start_time_str = request.session.get('session_start_time')
        rating = request.POST.get('rating')
        
        if pc_id and start_time_str:
            computer = Computer.objects.get(pc_id=pc_id)
            start_time = timezone.datetime.fromisoformat(start_time_str)
            
            # บันทึก UsageLog
            UsageLog.objects.create(
                user_id=user_id if user_id else 'Unknown',
                user_name=user_name,
                computer=computer,
                start_time=start_time,
                satisfaction_score=rating if rating else 5
            )
            
            # Reset PC
            computer.status = 'available'
            computer.current_user = None
            computer.session_start = None
            computer.save()
            
        request.session.flush()
        return redirect('index')


# --- Admin Portal Side ---

# ธนสิทธิ์ - Monitor Dashboard(GET ดูรายการ / POST แก้ไขสถานะ)
class AdminMonitorView(LoginRequiredMixin, View):
    def get(self, request):
        pass
    def post(self, request):
        pass

# อัษฎาวุธ - Booking(GET ดูรายการ / POST แก้ไขสถานะ)
class AdminBookingView(LoginRequiredMixin, View):
    def get(self, request):
        pass
    def post(self, request):
        pass

class AdminImportBookingView(LoginRequiredMixin, View):
    def post(self, request):
        pass

# ณัฐกรณ์ - Manage PC (GET ดูรายการ / POST แก้ไขสถานะ)
class AdminManagePcView(LoginRequiredMixin, View):
    def get(self, request):
        pass

    def post(self, request):
        pass

# ลลิดา - Software (GET ดูรายการ / POST เพิ่ม-แก้ไข)
class AdminSoftwareView(LoginRequiredMixin, View):
    def get(self, request):
        pass

    def post(self, request):
        pass

# เขมมิกา - Report
class AdminReportView(LoginRequiredMixin, View):
    def get(self, request):
        pass

# เขมมิกา - Report Export CSV
class AdminReportExportView(LoginRequiredMixin, View):
    def get(self, request):
        pass

# ภานุวัฒน์ - Config (GET ดูค่า / POST แก้ไขค่า)
class AdminConfigView(LoginRequiredMixin, View):
    def get(self, request):
        pass

    def post(self, request):
        pass


# --- API (ธนสิทธิ์) ---

class ApiMonitorDataView(View):
    def get(self, request):
        # ดึงข้อมูลคอมพิวเตอร์ทั้งหมดเพื่อส่งให้หน้า Monitor หรือ Timer เช็คสถานะ
        computers = Computer.objects.all().values('pc_id', 'name', 'status', 'current_user')
        data = list(computers)
        return JsonResponse({'data': data})