from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .models import Computer, UsageLog

# ==========================================
# 1. ฝั่งผู้ใช้งาน (User / Kiosk Side)
# ==========================================

def index(request):
    pc_id = request.GET.get('pc', '1')
    computer, created = Computer.objects.get_or_create(
        pc_id=pc_id, 
        defaults={'name': f'PC-{pc_id}', 'status': 'available'}
    )
    
    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        user_name = request.POST.get('user_name')
        # รับค่าเพิ่มเติมตามที่ auth.js ต้องการ
        user_level = request.POST.get('user_level', 'ทั่วไป')
        user_year = request.POST.get('user_year', '-')
        
        computer.status = 'in_use'
        computer.current_user = user_name
        computer.session_start = timezone.now()
        computer.save()
        
        # เก็บข้อมูลลง Session ให้ครบถ้วน
        request.session['session_pc_id'] = computer.id
        request.session['session_user_id'] = user_id
        request.session['session_user_name'] = user_name
        request.session['session_user_level'] = user_level
        request.session['session_user_year'] = user_year
        request.session['session_start_time'] = computer.session_start.isoformat()
        
        return redirect('timer')

    return render(request, 'cklab/kiosk/index.html', {'computer': computer})

def confirm(request):
    """
    หน้ายืนยันข้อมูล (confirm.html)
    """
    return render(request, 'cklab/kiosk/confirm.html')

def timer(request):
    if 'session_pc_id' not in request.session:
        return redirect('index')
    
    # ตัวอย่างการดึงข้อมูลส่งให้ Template
    context = {
        'user_name': request.session.get('session_user_name'),
        'start_time': request.session.get('session_start_time'),
        'computer': Computer.objects.get(id=request.session.get('session_pc_id')),
        # เพิ่มข้อมูลอื่นๆ ตามต้องการ
    }
    return render(request, 'cklab/kiosk/timer.html', context)

def feedback(request):
    if request.method == 'POST':
        pc_id = request.session.get('session_pc_id')
        
        if pc_id:
            try:
                computer = Computer.objects.get(id=pc_id)
                
                # บันทึก Log โดยดึงข้อมูลจาก Session ที่เก็บไว้ตอน Check-in
                UsageLog.objects.create(
                    user_id=request.session.get('session_user_id', 'Unknown'),
                    user_name=request.session.get('session_user_name', 'Unknown'),
                    computer=computer,
                    start_time=computer.session_start or timezone.now(),
                    satisfaction_score=request.POST.get('rating', 0)
                    # หากต้องการเก็บ Level/Year ใน Database ถาวร ต้องไปเพิ่ม Field ใน Models.py ก่อน
                )

                computer.status = 'available'
                computer.current_user = None
                computer.session_start = None
                computer.save()
            except Computer.DoesNotExist:
                pass

        request.session.flush()
        return redirect('index')

    return render(request, 'cklab/kiosk/feedback.html')


# ==========================================
# 2. ฝั่งผู้ดูแลระบบ (Admin Portal Side)
# ==========================================

def admin_login(request):
    # ใช้ Template login ที่สร้างไว้
    return render(request, 'cklab/admin/admin-login.html')

@login_required
def admin_monitor(request):
    # ส่งข้อมูลเครื่องทั้งหมดไปแสดงผลเบื้องต้น
    computers = Computer.objects.all().order_by('pc_id')
    return render(request, 'cklab/admin/admin-monitor.html', {'computers': computers})

@login_required
def admin_booking(request):
    return render(request, 'cklab/admin/admin-booking.html')

@login_required
def admin_manage_pc(request):
    return render(request, 'cklab/admin/admin-manage.html')

@login_required
def admin_software(request):
    return render(request, 'cklab/admin/admin-software.html')

@login_required
def admin_report(request):
    return render(request, 'cklab/admin/admin-report.html')

@login_required
def admin_config(request):
    return render(request, 'cklab/admin/admin-config.html')


# ==========================================
# 3. API (สำหรับ JavaScript Fetch)
# ==========================================

def api_monitor_data(request):
    """
    API ส่งข้อมูลสถานะเครื่องเป็น JSON สำหรับหน้า Monitor (Real-time)
    """
    computers = Computer.objects.all().order_by('pc_id')
    data = []
    for pc in computers:
        data.append({
            'pc_id': pc.pc_id,
            'name': pc.name,
            'status': pc.status,
            'current_user': pc.current_user,
            'session_start': pc.session_start.isoformat() if pc.session_start else None
        })
    
    return JsonResponse({'status': 'ok', 'data': data})