import sqlite3

try:
    conn = sqlite3.connect('fabsense.db')
    cursor = conn.cursor()
    cursor.execute("SELECT username, role FROM users")
    users = cursor.fetchall()
    print("Users in DB:", users)
except Exception as e:
    print("Error:", e)
