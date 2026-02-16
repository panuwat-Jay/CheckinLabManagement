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
    user_name = models.CharField(max_length=100)
    computer = models.ForeignKey('Computer', on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Booking: {self.user_name} - {self.computer}"

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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    pc_type = models.CharField(max_length=20, default='General')
    installed_software = models.ManyToManyField(Software, blank=True)
    
    # ฟิลด์สำหรับเก็บสถานะ Session ปัจจุบัน
    current_user = models.CharField(max_length=100, null=True, blank=True)
    session_start = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

# เขมมิกา - สร้าง Model สำหรับบันทึกการใช้งานคอมพิวเตอร์ (UsageLog)
class UsageLog(models.Model):
    user_id = models.CharField(max_length=50)
    user_name = models.CharField(max_length=100)
    computer = models.ForeignKey(Computer, on_delete=models.SET_NULL, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(auto_now_add=True)
    satisfaction_score = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user_name} ({self.start_time})"