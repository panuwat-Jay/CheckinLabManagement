# ปภังกร — User / Kiosk Side
from django.views import View


class IndexView(View):
    def get(self, request):
        pass

    def post(self, request):
        pass


class StatusView(View):
    def get(self, request, pc_id):
        pass


class CheckinView(View):
    def get(self, request, pc_id):
        pass

    def post(self, request, pc_id):
        pass


class CheckoutView(View):
    def get(self, request, pc_id):
        pass

    def post(self, request, pc_id):
        pass


class FeedbackView(View):
    def get(self, request, pc_id, software_id):
        pass

    def post(self, request, pc_id, software_id):
        pass
