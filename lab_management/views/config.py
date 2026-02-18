# ภานุวัฒน์ — Config (SiteConfig) + Admin User Management
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views import View
from ..models import SiteConfig


class AdminConfigView(LoginRequiredMixin, View):
    def get(self, request):
        pass

    def post(self, request):
        pass


class AdminUserView(LoginRequiredMixin, View):
    def get(self, request):
        pass

    def post(self, request):
        pass


class AdminUserEditView(LoginRequiredMixin, View):
    def get(self, request, pk):
        pass

    def post(self, request, pk):
        pass


class AdminUserDeleteView(LoginRequiredMixin, View):
    def post(self, request, pk):
        pass
