import csv
import json
import base64
import requests
import urllib3  # เพิ่ม library นี้สำหรับจัดการ SSL Warning

from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth import views as auth_views
import logging

logger = logging.getLogger(__name__)
from django.utils import timezone
from django.views import View
from django.views.generic import TemplateView
from .models import Booking, Computer, SiteConfig, Software, Status, UsageLog

# --- Helper Function for UBU API ---
def verify_ubu_user(user_id):
    """
    ตรวจสอบข้อมูลผู้ใช้จาก UBU API
    Ref: Doc API DSSI Project (Page 1-2)
    Note: ปรับปรุงให้รองรับ Response จริงที่เป็น Dict และ Status 201
    """
    # ปิดการแจ้งเตือนความปลอดภัย (SSL Warning)
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
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
        # verify=False เพื่อข้ามการตรวจสอบ SSL
        response = requests.post(url, headers=headers, data=payload, timeout=10, verify=False)
        
        # Debug: ปริ้นท์สถานะดูใน Terminal
        print(f"API Check: {user_id} -> Status {response.status_code}")
        
        # แก้ไข 1: ยอมรับทั้ง Status 200 (OK) และ 201 (Created)
        if response.status_code in [200, 201]:
            result_json = response.json()
            
            # ตรวจสอบว่ามี field 'data'
            if 'data' in result_json and result_json['data']:
                raw_data = result_json['data']
                user_info = None

                # แก้ไข 2: ตรวจสอบประเภทข้อมูลว่าเป็น List หรือ Dict
                if isinstance(raw_data, list):
                    # กรณีเป็น List (ตามคู่มือ)
                    if len(raw_data) > 0:
                        user_info = raw_data[0]
                elif isinstance(raw_data, dict):
                    # กรณีเป็น Dict (ของจริงที่เจอ)
                    user_info = raw_data
                
                if user_info:
                    # ประกอบชื่อ-สกุล (ภาษาไทย)
                    prefix = user_info.get('USERPREFIXNAME', '')
                    fname = user_info.get('USERNAME', '')
                    lname = user_info.get('USERSURNAME', '')
                    full_name = f"{prefix}{fname} {lname}".strip()
                    
                    faculty = user_info.get('FACULTYNAME', '')
                    user_type = user_info.get('USERTYPE', 'Student')

                    return {
                        'is_valid': True,
                        'user_id': user_id,
                        'name': full_name,
                        'faculty': faculty,
                        'user_type': user_type
                    }
            else:
                print(f"User {user_id} not found in API response data.")
                
    except requests.exceptions.RequestException as e:
        print(f"API Connection Error: {e}")
    
    return None


# --- User / Kiosk Side (ปภังกร) ---

class IndexView(View):
    def get(self, request):
        # 1. รับค่า pc จาก URL (เช่น ?pc=2) ถ้าไม่ใส่มาให้ Default เป็น "1"
        pc_id = request.GET.get('pc', '1')
        
        # ค้นหาหรือสร้างเครื่องตาม pc_id ที่ระบุมา
        # ถ้ายังไม่มีเครื่องเลขนี้ ให้สร้างใหม่โดยตั้งชื่ออัตโนมัติว่า PC-{pc_id}
        computer, created = Computer.objects.get_or_create(
            pc_id=pc_id, 
            defaults={'name': f'PC-{pc_id}', 'status': 'available', 'pc_type': 'General'}
        )
        
        # 2. Config
        config = SiteConfig.objects.first()
        if not config:
            config = SiteConfig.objects.create(lab_name="CKLab Computer Center")

        # 3. Redirect ถ้าเครื่องนี้มี Session ค้างอยู่ (เช่น กด Refresh หน้าเดิม)
        # ตรวจสอบว่า Session ที่ค้างอยู่ เป็นของเครื่องนี้จริงๆ หรือไม่
        if computer.status == 'in_use' and request.session.get('session_pc_id') == pc_id:
            return redirect('timer')

        context = {
            'computer': computer,
            'config': config
        }
        return render(request, 'cklab/kiosk/index.html', context)

    def post(self, request):
        # รับค่าจากฟอร์ม
        user_id = request.POST.get('user_id')
        user_name = request.POST.get('user_name') 
        user_type = request.POST.get('user_type', 'internal')
        
        # จุดสำคัญ: รับ pc_id จาก Hidden Input ที่ส่งมาจากหน้าเว็บ
        pc_id = request.POST.get('pc_id')

        if not user_id or not pc_id:
            return redirect('index')
        
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
        
        # ป้องกันกรณี Admin สั่ง Force Stop หรือสถานะเปลี่ยนไปแล้ว
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
        # 1. ดึงข้อมูล Session เก็บไว้ก่อนจะ Flush
        pc_id = request.session.get('session_pc_id')
        user_id = request.session.get('session_user_id')
        user_name = request.session.get('session_user_name')
        start_time_str = request.session.get('session_start_time')
        rating = request.POST.get('rating')
        
        if pc_id and start_time_str:
            # ดึง Object ใหม่เพื่อความชัวร์
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
            
        # ล้าง Session (Logout)
        request.session.flush()
        
        # 2. Redirect กลับไปที่หน้า Index พร้อมระบุเครื่องเดิม
        if pc_id:
            return redirect(f'/?pc={pc_id}')
        else:
            return redirect('index')


# --- Custom login view for debugging CSRF issues ---

class DebugLoginView(auth_views.LoginView):
    """Extends the built-in LoginView to log CSRF token/cookie values.
    Useful to diagnose mismatches when a 403 occurs.
    """
    def post(self, request, *args, **kwargs):
        tok = request.POST.get('csrfmiddlewaretoken')
        cookie = request.COOKIES.get('csrftoken')
        host = request.get_host()
        referer = request.META.get('HTTP_REFERER')
        # print to console in case logging not configured for DEBUG
        print(f"DEBUG Login POST host={host}, referer={referer}, token={tok}, cookie={cookie}")
        logger.debug(f"POST csrfmiddlewaretoken={tok}")
        logger.debug(f"Cookie csrftoken={cookie}")
        logger.debug(f"Host={host} Referer={referer}")
        return super().post(request, *args, **kwargs)

# --- Admin Portal Side (Placeholder) ---

class AdminMonitorView(LoginRequiredMixin, View):
    def get(self, request):
        # Basic placeholder page for monitoring computers
        return render(request, 'cklab/admin/admin-monitor.html')

    def post(self, request):
        # For now, just redirect back to the same page. Future actions can be added here.
        return self.get(request)

class AdminBookingView(LoginRequiredMixin, View):
    def get(self, request):
        # TODO: implement booking management page
        return HttpResponse("Admin booking page not implemented yet.")

    def post(self, request):
        # no action for now
        return self.get(request)

class AdminImportBookingView(LoginRequiredMixin, View):
    def post(self, request):
        # placeholder for file import action
        return HttpResponse("Import booking endpoint not implemented.")

class AdminManagePcView(LoginRequiredMixin, View):
    def get(self, request):
        return HttpResponse("Admin manage PC page not implemented yet.")

    def post(self, request):
        return self.get(request)

class AdminSoftwareView(LoginRequiredMixin, View):
    def get(self, request):
        return HttpResponse("Admin software page not implemented yet.")

    def post(self, request):
        return self.get(request)

class AdminReportView(LoginRequiredMixin, View):
    def get(self, request):
        return HttpResponse("Admin report page not implemented yet.")

class AdminReportExportView(LoginRequiredMixin, View):
    def get(self, request):
        return HttpResponse("Admin report export not implemented yet.")

class AdminConfigView(LoginRequiredMixin, View):
    def get(self, request):
        return HttpResponse("Admin config page not implemented yet.")

    def post(self, request):
        return self.get(request)


# --- API (ธนสิทธิ์) ---

class ApiMonitorDataView(View):
    def get(self, request):
        # 1. ดึงข้อมูลคอมพิวเตอร์ทั้งหมด (ระบุฟิลด์ที่จำเป็นต้องใช้ในหน้า Monitor)
        computers = Computer.objects.all().values('pc_id', 'name', 'status', 'current_user', 'start_time')
        
        # 2. แปลง QuerySet เป็น List (ต้องทำก่อนบรรทัด return)
        data = list(computers)
        
        # 3. ส่งกลับไปในรูปแบบ JSON โดยใช้ Key ว่า 'pcs' เพื่อให้ตรงกับไฟล์ admin-monitor.js
        return JsonResponse({'pcs': data}, safe=False)