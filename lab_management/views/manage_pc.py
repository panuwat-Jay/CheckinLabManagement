# ณัฐกรณ์ — Manage PC
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views import View
from ..models import Computer, Status


class AdminManagePcView(LoginRequiredMixin, View):
    def get(self, request):
        pass


class AdminAddPcView(LoginRequiredMixin, View):
    def get(self, request):
        pass

    def post(self, request):
        pass


class AdminManagePcEditView(LoginRequiredMixin, View):
    def get(self, request, pc_id):
        pass

    def post(self, request, pc_id):
        pass


class AdminManagePcDeleteView(LoginRequiredMixin, View):
    def post(self, request, pc_id):
        pass
