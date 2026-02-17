from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # 1. ฝั่งผู้ใช้งาน (User / Kiosk) - ผู้รับผิดชอบ: ปภังกร
    path('', views.IndexView.as_view(), name='index'),
    path('confirm/', views.ConfirmView.as_view(), name='confirm'),
    path('timer/', views.TimerView.as_view(), name='timer'),
    path('feedback/', views.FeedbackView.as_view(), name='feedback'),

    # API สำหรับตรวจสอบผู้ใช้ (เพิ่มใหม่)
    path('api/verify-user/', views.ApiVerifyUserView.as_view(), name='api_verify_user'),

    # 2. ระบบ Login - ผู้รับผิดชอบ: สถาพร
    path('admin-portal/login/', auth_views.LoginView.as_view(template_name='cklab/admin/admin-login.html'), name='login'),
    path('admin-portal/logout/', auth_views.LogoutView.as_view(next_page='/'), name='logout'),

    # 3. ฝั่งผู้ดูแลระบบ (Admin Portal)
    path('admin-portal/monitor/', views.AdminMonitorView.as_view(), name='admin_monitor'), # ธนสิทธิ์
    path('api/monitor-data/', views.ApiMonitorDataView.as_view(), name='api_monitor_data'), # ธนสิทธิ์ (สำหรับหน้า Admin Monitor)
    path('admin-portal/booking/', views.AdminBookingView.as_view(), name='admin_booking'), # อัษฎาวุธ
    path('admin-portal/manage-pc/', views.AdminManagePcView.as_view(), name='admin_manage_pc'), # ณัฐกรณ์
    path('admin-portal/software/', views.AdminSoftwareView.as_view(), name='admin_software'), # ลลิดา
    path('admin-portal/report/', views.AdminReportView.as_view(), name='admin_report'), # เขมมิกา
    path('admin-portal/report/export/', views.AdminReportExportView.as_view(), name='admin_report_export'), # เขมมิกา
    
    # 4. System Config & Manage User - ภานุวัฒน์
    path('admin-portal/config/', views.AdminConfigView.as_view(), name='admin_config'), 
    path('admin-portal/config/update/', views.AdminConfigView.as_view(), name='admin_config_update'), 
    path('admin-portal/config/manage-user/', views.AdminManageUserView.as_view(), name='admin_manage_user'), 
]