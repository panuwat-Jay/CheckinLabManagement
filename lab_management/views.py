import csv

from django.shortcuts import redirect
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.utils import timezone
from django.views import View
from django.views.generic import TemplateView
from .models import Booking, Computer, SiteConfig, Software, Status, UsageLog


# --- User / Kiosk Side (ปภังกร) ---

class IndexView(View):
    def get(self, request):
        pass

    def post(self, request):
        pass

class ConfirmView(TemplateView):
    template_name = 'cklab/kiosk/confirm.html'

class TimerView(View):
    def get(self, request):
        pass

class FeedbackView(View):
    def get(self, request):
        pass

    def post(self, request):
        pass


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
        pass
