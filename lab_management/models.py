from django.db import models

# ภานุวัฒน์ - สร้าง Model สำหรับการตั้งค่าระบบ (Config) เพื่อเก็บข้อมูลการตั้งค่าต่าง ๆ ของระบบ
class SiteConfig(models.Model):
    lab_name = models.CharField(max_length=100, default="CKLab")
    max_session_minutes = models.PositiveIntegerField(default=120)
    booking_enabled = models.BooleanField(default=True)
    announcement = models.TextField(default="", blank=True)

    def __str__(self):
        return self.lab_name

# ลลิดา - สร้าง Model สำหรับ Software เพื่อเก็บข้อมูลซอฟต์แวร์ที่ติดตั้งในห้องปฏิบัติการ
class Software(models.Model):
    TYPE_CHOICES = [('AI', 'AI Tool'), ('Software', 'General Software')]
    name = models.CharField(max_length=100)
    version = models.CharField(max_length=50)
    software_type = models.CharField(max_length=20, choices=TYPE_CHOICES)

    def __str__(self):
        return f"{self.name} ({self.version})"

# อัษฎาวุธ - สร้าง Model สำหรับการจองคอมพิวเตอร์ (Booking) เพื่อเก็บข้อมูลการจองของผู้ใช้
class Booking(models.Model):
    BOOKING_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
        ('cancelled', 'Cancelled')
    ]
    
    user_name = models.CharField(max_length=100)
    pc_id = models.IntegerField()  # Reference to Computer
    date = models.DateField()  # Booking date (YYYY-MM-DD format)
    start_time = models.CharField(max_length=5)  # HH:MM format
    end_time = models.CharField(max_length=5)  # HH:MM format
    status = models.CharField(max_length=20, choices=BOOKING_STATUS, default='pending')
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Booking: {self.user_name} - PC{self.pc_id} ({self.date})"

# ณัฐกรณ์ - สร้าง Model สำหรับสถานะเครื่องคอมพิวเตอร์ (Status) เพื่อระบุว่าเครื่องนั้นอยู่ในสถานะอะไร
class Status(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

# ธนสิทธิ์ - สร้าง Model สำหรับคอมพิวเตอร์ (Computer) เพื่อเก็บข้อมูลสถานะและการใช้งานของคอมพิวเตอร์แต่ละเครื่องในห้องปฏิบัติการ
class Computer(models.Model):
    STATUS_CHOICES = [
        ('available', 'ว่าง'),
        ('in_use', 'ใช้งานอยู่'),
        ('reserved', 'จองแล้ว'),
        ('maintenance', 'แจ้งซ่อม')
    ]
    
    pc_id = models.CharField(max_length=10, unique=True)  # ฟิลด์ที่ Error ถามหา
    name = models.CharField(max_length=50)
    code_name = models.CharField(max_length=50, null=True, blank=True)  # AI codename (e.g., "Alpha", "Beta")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    pc_type = models.CharField(max_length=20, default='General')
    installed_software = models.JSONField(default=list, help_text="List of installed software")  # Changed to JSONField
    
    # ฟิลด์สำหรับเก็บสถานะ Session ปัจจุบัน
    current_user = models.CharField(max_length=100, null=True, blank=True)
    session_start = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

# เขมมิกา - สร้าง Model สำหรับบันทึกการใช้งานคอมพิวเตอร์ (UsageLog)
class UsageLog(models.Model):
    # Session details
    user_id = models.CharField(max_length=50)
    user_name = models.CharField(max_length=100)
    user_role = models.CharField(max_length=50, default='Guest')
    user_faculty = models.CharField(max_length=100, default='-')
    user_level = models.CharField(max_length=50, default='-')
    user_year = models.CharField(max_length=50, default='-')
    
    pc_id = models.IntegerField()  # Reference to Computer
    action = models.CharField(max_length=50)  # START_SESSION, END_SESSION, etc.
    start_time = models.DateTimeField()
    timestamp = models.DateTimeField(auto_now_add=True)
    duration_minutes = models.IntegerField(default=0)
    
    # Usage details
    used_software = models.JSONField(default=list)
    is_ai_used = models.BooleanField(default=False)
    slot_id = models.CharField(max_length=50, default='Unlimited')
    details = models.TextField(blank=True, default='')
    
    # Feedback
    satisfaction_score = models.IntegerField(null=True, blank=True)
    comment = models.TextField(blank=True, default='')
    
    def __str__(self):
        return f"{self.user_name} - PC{self.pc_id} ({self.start_time})"