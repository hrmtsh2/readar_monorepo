import sqlite3

conn = sqlite3.connect('readar.db')
cursor = conn.cursor()

# Check users
cursor.execute('SELECT id, email FROM users')
users = cursor.fetchall()
print('Users:')
for user in users:
    print(f'  ID: {user[0]}, Email: {user[1]}')

print('\nReservations by user:')
cursor.execute('''
    SELECT u.id, u.email, COUNT(r.id) as reservation_count
    FROM users u
    LEFT JOIN reservations r ON u.id = r.user_id
    GROUP BY u.id, u.email
''')
results = cursor.fetchall()
for result in results:
    print(f'  User {result[0]} ({result[1]}): {result[2]} reservations')

conn.close()
