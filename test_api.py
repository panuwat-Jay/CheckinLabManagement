import requests
import json
import base64
import urllib3

# ปิดแจ้งเตือนความปลอดภัย (SSL Warning)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_ubu_api(student_id):
    url = "https://esapi.ubu.ac.th/api/v1/student/reg-data"
    
    print(f"กำลังทดสอบเชื่อมต่อ API สำหรับรหัส: {student_id}")
    print("-" * 50)

    # 1. ลองแปลงรหัสเป็น Base64
    try:
        encoded_id = base64.b64encode(student_id.encode('utf-8')).decode('utf-8')
        print(f"Base64 Payload: {encoded_id}")
    except Exception as e:
        print(f"Encoding Error: {e}")
        return

    payload = json.dumps({
        "loginName": encoded_id
    })
    
    headers = {
        'Content-Type': 'application/json'
    }

    # 2. ยิง Request ไปที่มหาลัย
    try:
        # verify=False คือกุญแจสำคัญในการทะลุ VPN มหาลัย
        response = requests.post(url, headers=headers, data=payload, timeout=10, verify=False)
        
        print(f"Status Code: {response.status_code}")
        print("Response Raw Data:")
        print(response.text) # ดูข้อมูลดิบที่ส่งกลับมา
        print("-" * 50)
        
        if response.status_code == 200:
            data = response.json()
            if 'data' in data and data['data']:
                print("✅ พบข้อมูลผู้ใช้!")
                user = data['data'][0]
                print(f"ชื่อ: {user.get('USERPREFIXNAME', '')}{user.get('USERNAME', '')} {user.get('USERSURNAME', '')}")
            else:
                print("❌ เชื่อมต่อสำเร็จ แต่ API บอกว่า 'ไม่พบข้อมูล' (data ว่างเปล่า)")
                print("สาเหตุที่เป็นไปได้: รหัสนักศึกษาผิด หรือ ยังไม่มีข้อมูลในระบบ REG")
        else:
            print("❌ เกิดข้อผิดพลาดจาก Server")
            
    except requests.exceptions.RequestException as e:
        print("❌ เชื่อมต่อไม่ได้ (Connection Error)")
        print(f"Error Detail: {e}")
        print("คำแนะนำ: เช็คว่า OpenVPN เชื่อมต่ออยู่จริงหรือไม่ หรือเน็ตหลุด")

# รันฟังก์ชันทดสอบ
if __name__ == "__main__":
    # เปลี่ยนรหัสนักศึกษาตรงนี้เป็นรหัสที่คุณต้องการเทส
    test_id = "68114540353" 
    test_ubu_api(test_id)