import csv
import json
import base64
import requests
import urllib3  # สำหรับจัดการ SSL Warning

from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.utils import timezone
from django.views import View
from django.views.generic import TemplateView
from django.contrib.auth.models import User 
from django.contrib import messages

from .models import Booking, Computer, SiteConfig, Software, Status, UsageLog

# ปิดการแจ้งเตือนความปลอดภัย (SSL Warning)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --- Helper Function for UBU API ---
def verify_ubu_user(user_id):
    """
    ตรวจสอบข้อมูลผู้ใช้จาก UBU API
    Ref: Doc API DSSI Project (Page 1-2)
    Note: ปรับปรุงให้รองรับ Response จริงที่เป็น Dict และ Status 201
    """
    url = "https://esapi.ubu.ac.th/api/v1/student/reg-data"
    
    # Encode user_id to Base64
    try:
        encoded_id = base64.b64encode(user_id.encode('utf-8')).decode('utf-8')
    except Exception as e:
        print(f"Encoding Error: {e}")
        return None

    payload = json.dumps({"loginName": encoded_id})
    headers = {'Content-Type': 'application/json'}

    try:
        # verify=False เพื่อข้ามการตรวจสอบ SSL
        response = requests.post(url, headers=headers, data=payload, timeout=10, verify=False)
        print(f"API Check: {user_id} -> Status {response.status_code}")
        
        if response.status_code in [200, 201]:
            result_json = response.json()
            if 'data' in result_json and result_json['data']:
                raw_data = result_json['data']
                user_info = None

                if isinstance(raw_data, list) and len(raw_data) > 0:
                    user_info = raw_data[0]
                elif isinstance(raw_data, dict):
                    user_info = raw_data
                
                if user_info:
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
        pc_id = request.GET.get('pc', '1')
        computer, created = Computer.objects.get_or_create(
            pc_id=pc_id, 
            defaults={'name': f'PC-{pc_id}', 'status': 'available', 'pc_type': 'General'}
        )
        
        config = SiteConfig.objects.first()
        if not config:
            config = SiteConfig.objects.create(lab_name="CKLab Computer Center")

        if computer.status == 'in_use' and request.session.get('session_pc_id') == pc_id:
            return redirect('timer')

        context = {'computer': computer, 'config': config}
        return render(request, 'cklab/kiosk/index.html', context)

    def post(self, request):
        user_id = request.POST.get('user_id')
        user_name = request.POST.get('user_name') 
        user_type = request.POST.get('user_type', 'internal')
        pc_id = request.POST.get('pc_id')

        if not user_id or not pc_id:
            return redirect('index')
        
        computer = get_object_or_404(Computer, pc_id=pc_id)
        
        computer.status = 'in_use'
        computer.current_user = user_name
        computer.session_start = timezone.now()
        computer.save()

        request.session['session_pc_id'] = pc_id
        request.session['session_user_id'] = user_id
        request.session['session_user_name'] = user_name
        request.session['session_start_time'] = computer.session_start.isoformat()

        return redirect('timer')


class ApiVerifyUserView(View):
    def get(self, request):
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'message': 'User ID required'}, status=400)
        
        result = verify_ubu_user(user_id)
        
        if result:
            return JsonResponse({'success': True, 'data': result})
        else:
            return JsonResponse({'success': False, 'message': 'ไม่พบข้อมูล หรือการเชื่อมต่อมีปัญหา'}, status=404)


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
            
            UsageLog.objects.create(
                user_id=user_id if user_id else 'Unknown',
                user_name=user_name,
                computer=computer,
                start_time=start_time,
                satisfaction_score=rating if rating else 5
            )
            
            computer.status = 'available'
            computer.current_user = None
            computer.session_start = None
            computer.save()
            
        request.session.flush()
        
        if pc_id:
            return redirect(f'/?pc={pc_id}')
        return redirect('index')


# --- Admin Portal Side ---

class AdminMonitorView(LoginRequiredMixin, View):
    def get(self, request):
        computers = Computer.objects.all().order_by('pc_id')
        return render(request, 'cklab/admin_monitor.html', {'computers': computers})
        
    def post(self, request):
        return redirect('admin_monitor')

class AdminBookingView(LoginRequiredMixin, View):
    def get(self, request):
        bookings = Booking.objects.all()
        return render(request, 'cklab/admin_booking.html', {'bookings': bookings})
        
    def post(self, request):
        return redirect('admin_booking')

class AdminImportBookingView(LoginRequiredMixin, View):
    def post(self, request):
        messages.success(request, "นำเข้าข้อมูลสำเร็จ (ระบบจำลอง)")
        return redirect('admin_booking')

class AdminManagePcView(LoginRequiredMixin, View):
    def get(self, request):
        computers = Computer.objects.all().order_by('pc_id')
        return render(request, 'cklab/admin_manage.html', {'computers': computers})
        
    def post(self, request):
        return redirect('admin_manage_pc')

class AdminSoftwareView(LoginRequiredMixin, View):
    def get(self, request):
        softwares = Software.objects.all()
        return render(request, 'cklab/admin_software.html', {'softwares': softwares})
        
    def post(self, request):
        return redirect('admin_software')

class AdminReportView(LoginRequiredMixin, View):
    def get(self, request):
        logs = UsageLog.objects.all()
        return render(request, 'cklab/admin_report.html', {'logs': logs})

class AdminReportExportView(LoginRequiredMixin, View):
    def get(self, request):
        # โค้ดสำหรับ Export CSV สามารถใส่ตรงนี้
        return HttpResponse("ระบบส่งออกไฟล์ CSV")

# --- System Config & Manage User ---

class AdminConfigView(LoginRequiredMixin, View):
    def get(self, request):
        config = SiteConfig.objects.first()
        if not config:
            config = SiteConfig.objects.create(lab_name="CKLab Computer Center")
            
        admins = User.objects.all().order_by('-is_superuser', 'username')
        
        return render(request, 'cklab/admin/admin-config.html', {
            'config': config, 
            'admins': admins
        })

    def post(self, request):
        config_type = request.POST.get('config_type')
        if config_type == 'general':
            config = SiteConfig.objects.first()
            if not config: 
                config = SiteConfig.objects.create()
                
            config.lab_name = request.POST.get('lab_name')
            config.location = request.POST.get('location')
            config.contact_email = request.POST.get('contact_email')
            config.contact_phone = request.POST.get('contact_phone')
            config.admin_on_duty = request.POST.get('admin_on_duty')
            config.max_usage_minutes = request.POST.get('max_usage_minutes', 180)
            config.is_open = 'is_open' in request.POST 
            config.close_message = request.POST.get('close_message')
            
            config.save()
            messages.success(request, "บันทึกการตั้งค่าระบบเรียบร้อยแล้ว")
            
        return redirect('admin_config')

class AdminManageUserView(LoginRequiredMixin, View):
    """ คลาสสำหรับเพิ่ม, แก้ไข, ลบ User ผู้ดูแลระบบ (รับค่าจาก Modal ในหน้า Config) """
    def post(self, request):
        action = request.POST.get('action')
        user_id = request.POST.get('user_id')
        
        # 1. สร้างผู้ใช้ใหม่
        if action == 'create':
            username = request.POST.get('username')
            full_name = request.POST.get('full_name', '')
            password = request.POST.get('password')
            role = request.POST.get('role')
            
            if User.objects.filter(username=username).exists():
                messages.error(request, f'ชื่อผู้ใช้ "{username}" มีอยู่ในระบบแล้ว')
            else:
                first_name = full_name.split()[0] if full_name else ''
                last_name = " ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else ''
                is_super = (role == 'Super Admin')
                
                User.objects.create_user(
                    username=username, 
                    password=password, 
                    first_name=first_name, 
                    last_name=last_name, 
                    is_superuser=is_super, 
                    is_staff=True
                )
                messages.success(request, 'เพิ่มผู้ดูแลระบบเรียบร้อยแล้ว')
                
        # 2. แก้ไขผู้ใช้
        elif action == 'update':
            user = get_object_or_404(User, id=user_id)
            full_name = request.POST.get('full_name', '')
            password = request.POST.get('password')
            role = request.POST.get('role')
            
            user.first_name = full_name.split()[0] if full_name else ''
            user.last_name = " ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else ''
            user.is_superuser = (role == 'Super Admin')
            
            if password: # อัปเดตพาสเวิร์ดหากมีการกรอกมา
                user.set_password(password)
                
            user.save()
            messages.success(request, 'อัปเดตข้อมูลผู้ดูแลระบบเรียบร้อยแล้ว')
            
        # 3. ลบผู้ใช้
        elif action == 'delete':
            user = get_object_or_404(User, id=user_id)
            if user.id == request.user.id:
                messages.error(request, 'ไม่สามารถลบบัญชีของตนเองที่กำลังเข้าสู่ระบบได้')
            else:
                user.delete()
                messages.success(request, 'ลบผู้ดูแลระบบเรียบร้อยแล้ว')
                
        return redirect('admin_config')


# --- API (ธนสิทธิ์) ---

class ApiMonitorDataView(View):
    def get(self, request):
        # ดึงข้อมูลคอมพิวเตอร์ทั้งหมดเพื่อส่งให้หน้า Monitor หรือ Timer เช็คสถานะ
        computers = Computer.objects.all().values('pc_id', 'name', 'status', 'current_user')
        data = list(computers)
        return JsonResponse({'data': data})