from django.contrib import admin
from .models import Computer, Software, UsageLog
admin.site.register(Computer)
admin.site.register(Software)
admin.site.register(UsageLog)