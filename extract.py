import json

log_file = 'C:/Users/KARTHIKEYAN R/.gemini/antigravity/brain/c3823f53-dec9-4aa4-ac7b-39780e44ee87/.system_generated/logs/transcript.jsonl'
lines = open(log_file, 'r', encoding='utf-8').readlines()

for line in reversed(lines):
    data = json.loads(line)
    if data.get('type') == 'TOOL_CALL_RESPONSE':
        content = data.get('content', '')
        if 'The following changes were made by the multi_replace_file_content tool' in content and 'qr-management' in content:
            diff_lines = []
            for ln in content.split('\n'):
                if ln.startswith('-'):
                    # Remove the '-' prefix
                    diff_lines.append(ln[1:])
            
            with open('d:/smart stock pharmacy management/frontend/restored_html.txt', 'w', encoding='utf-8') as f:
                f.write('\n'.join(diff_lines))
            print("Successfully extracted deleted lines to restored_html.txt")
            break
