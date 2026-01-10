import sqlite3
try:
    conn = sqlite3.connect('instance/safecity.db')
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) FROM detection")
    count = cursor.fetchone()[0]
    print(f"Total detections: {count}")
    cursor.execute("SELECT type, plate_number, timestamp FROM detection ORDER BY timestamp DESC LIMIT 5")
    rows = cursor.fetchall()
    for row in rows:
        print(f"[{row[2]}] Type: {row[0]}, Plate: {row[1]}")
    conn.close()
except Exception as e:
    print(f"DB Error: {e}")
