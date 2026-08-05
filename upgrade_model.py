with open('d:/smart stock pharmacy management/backend/app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace flash-lite with pro
content = content.replace('gemini-2.5-flash-lite', 'gemini-2.5-pro')

with open('d:/smart stock pharmacy management/backend/app.py', 'w', encoding='utf-8') as f:
    f.write(content)
