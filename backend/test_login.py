import requests

BASE = "http://127.0.0.1:8000/api"

# Test 1: Wrong creds
r = requests.post(f"{BASE}/login/", json={"email": "nobody@example.com", "password": "wrong"})
print(f"[Wrong creds] {r.status_code} -> {r.text}")

# Test 2: Empty body
r2 = requests.post(f"{BASE}/login/", json={})
print(f"[Empty body]  {r2.status_code} -> {r2.text}")

# Test 3: Signup then login
TEST_EMAIL = "autotest_seniormind@test.com"
TEST_PASS  = "TestPass123"

r3 = requests.post(f"{BASE}/signup/", json={
    "name": "Auto Tester", "email": TEST_EMAIL, "password": TEST_PASS, "age": 70
})
print(f"[Signup]      {r3.status_code} -> {r3.text[:120]}")

r4 = requests.post(f"{BASE}/login/", json={"email": TEST_EMAIL, "password": TEST_PASS})
print(f"[Login]       {r4.status_code} -> {r4.text[:120]}")
