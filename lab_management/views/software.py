# ลลิดา — Software
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views import View
from ..models import Software


class AdminSoftwareView(LoginRequiredMixin, View):
    def get(self, request):
        pass

    def post(self, request):
        pass


class AdminSoftwareEditView(LoginRequiredMixin, View):
    def get(self, request, pk):
        pass

    def post(self, request, pk):
        pass


class AdminSoftwareDeleteView(LoginRequiredMixin, View):
    def post(self, request, pk):
        pass
