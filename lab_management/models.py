from django.db import models

# ภานุวัฒน์ - สร้าง Model สำหรับการตั้งค่าระบบ (Config) เพื่อเก็บข้อมูลการตั้งค่าต่าง ๆ ของระบบ
class SiteConfig(models.Model):
    lab_name = models.CharField(max_length=255)
    
# ลลิดา - สร้าง Model สำหรับ Software เพื่อเก็บข้อมูลซอฟต์แวร์ที่ติดตั้งในห้องปฏิบัติการ
class Software(models.Model):
    pass
# อัษฎาวุธ - สร้าง Model สำหรับการจองคอมพิวเตอร์ (Booking) เพื่อเก็บข้อมูลการจองของผู้ใช้
class Booking(models.Model):
    pass
# ณัฐกรณ์ - สร้าง Model สำหรับสถานะเครื่องคอมพิวเตอร์ (Status) เพื่อระบุว่าเครื่องนั้นอยู่ในสถานะอะไร
class Status(models.Model):
    pass

# ธนสิทธิ์ - สร้าง Model สำหรับคอมพิวเตอร์ (Computer) เพื่อเก็บข้อมูลสถานะและการใช้งานของคอมพิวเตอร์แต่ละเครื่องในห้องปฏิบัติการ
class Computer(models.Model):
    pass

# เขมมิกา - สร้าง Model สำหรับบันทึกการใช้งานคอมพิวเตอร์ (UsageLog)
class UsageLog(models.Model):
    pass
