from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # 1. ฝั่งผู้ใช้งาน (User / Kiosk) - ผู้รับผิดชอบ: ปภังกร
    path('', views.IndexView.as_view(), name='index'),
    path('checkin/<str:pc_id>/', views.CheckinView.as_view(), name='checkin'),
    path('checkout/<str:pc_id>/', views.CheckoutView.as_view(), name='checkout'),
    path('status/<str:pc_id>/', views.StatusView.as_view(), name='status'),
    path('feedback/<str:pc_id>/<int:software_id>/', views.FeedbackView.as_view(), name='feedback'),

    # 2. ระบบ Login + จัดการ Admin User - ผู้รับผิดชอบ: สถาพร (สำรอง โดย ภานุวัฒน์)
    path('admin-portal/login/', auth_views.LoginView.as_view(template_name='cklab/admin/admin-login.html'), name='login'),
    path('admin-portal/logout/', auth_views.LogoutView.as_view(next_page='/'), name='logout'),
    path('admin-portal/users/', views.AdminUserView.as_view(), name='admin_user'), # สถาพร (สำรอง โดย ภานุวัฒน์)
    path('admin-portal/users/<int:pk>/edit/', views.AdminUserEditView.as_view(), name='admin_user_edit'), # สถาพร (สำรอง โดย ภานุวัฒน์)
    path('admin-portal/users/<int:pk>/delete/', views.AdminUserDeleteView.as_view(), name='admin_user_delete'), # สถาพร (สำรอง โดย ภานุวัฒน์)

    # 3. ฝั่งผู้ดูแลระบบ (Admin Portal)
    path('admin-portal/monitor/', views.AdminMonitorView.as_view(), name='admin_monitor'), # ธนสิทธิ์ (สำรอง โดย ปภังกร)
    path('admin-portal/checkin/<str:pc_id>/', views.AdminCheckinView.as_view(), name='admin_checkin'), # ธนสิทธิ์ (สำรอง โดย ปภังกร)
    path('admin-portal/checkout/<str:pc_id>/', views.AdminCheckoutView.as_view(), name='admin_checkout'), # ธนสิทธิ์ (สำรอง โดย ปภังกร)
    path('admin-portal/booking/', views.AdminBookingView.as_view(), name='admin_booking'), # อัษฎาวุธ (สำรอง โดย ลลิดา)
    path('admin-portal/booking/<int:pk>/', views.AdminBookingDetailView.as_view(), name='admin_booking_detail'), # อัษฎาวุธ (สำรอง โดย ลลิดา)
    path('admin-portal/booking/import/', views.AdminImportBookingView.as_view(), name='admin_booking_import'), # อัษฎาวุธ  (สำรอง โดย ลลิดา)
    path('admin-portal/manage-pc/', views.AdminManagePcView.as_view(), name='admin_manage_pc'), # ณัฐกรณ์  (สำรอง โดย ลลิดา)
    path('admin-portal/manage-pc/add/', views.AdminAddPcView.as_view(), name='admin_add_pc'), # ณัฐกรณ์
    path('admin-portal/manage-pc/<str:pc_id>/edit/', views.AdminManagePcEditView.as_view(), name='admin_manage_pc_edit'), # ณัฐกรณ์ (สำรอง โดย ลลิดา)
    path('admin-portal/manage-pc/<str:pc_id>/delete/', views.AdminManagePcDeleteView.as_view(), name='admin_manage_pc_delete'), # ณัฐกรณ์ (สำรอง โดย ลลิดา)
    path('admin-portal/software/', views.AdminSoftwareView.as_view(), name='admin_software'), # ลลิดา  
    path('admin-portal/software/<int:pk>/edit/', views.AdminSoftwareEditView.as_view(), name='admin_software_edit'), # ลลิดา
    path('admin-portal/software/<int:pk>/delete/', views.AdminSoftwareDeleteView.as_view(), name='admin_software_delete'), # ลลิดา
    path('admin-portal/report/', views.AdminReportView.as_view(), name='admin_report'), # เขมมิกา
    path('admin-portal/report/export/', views.AdminReportExportView.as_view(), name='admin_report_export'), # เขมมิกา
    path('admin-portal/config/', views.AdminConfigView.as_view(), name='admin_config'), # ภานุวัฒน์

]
