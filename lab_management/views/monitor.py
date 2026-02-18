# ธนสิทธิ์ — Admin Monitor Dashboard + API
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views import View
from ..models import Computer


class AdminMonitorView(LoginRequiredMixin, View):
    def get(self, request):

        
        pass

    def post(self, request):
        pass


class AdminCheckinView(LoginRequiredMixin, View):
    def post(self, request, pc_id):
        pass


class AdminCheckoutView(LoginRequiredMixin, View):
    def post(self, request, pc_id):
        pass
