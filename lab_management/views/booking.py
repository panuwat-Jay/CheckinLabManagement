# อัษฎาวุธ — Booking
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views import View
from ..models import Booking


class AdminBookingView(LoginRequiredMixin, View):
    def get(self, request):
        pass

    def post(self, request):
        pass


class AdminBookingDetailView(LoginRequiredMixin, View):
    def get(self, request, pk):
        pass

    def post(self, request, pk):
        pass


class AdminImportBookingView(LoginRequiredMixin, View):
    def post(self, request):
        pass
