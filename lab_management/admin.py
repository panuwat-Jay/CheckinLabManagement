from django.contrib import admin
from .models import Booking, Computer, SiteConfig, Software, Status, UsageLog
admin.site.register(Booking)
admin.site.register(Computer)
admin.site.register(SiteConfig)
admin.site.register(Software)
admin.site.register(Status)
admin.site.register(UsageLog)