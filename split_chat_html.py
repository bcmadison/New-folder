import os
import re

input_file = "chat.html"
output_dir = "chat_html_split"

os.makedirs(output_dir, exist_ok=True)

with open(input_file, "r", encoding="utf-8") as f:
    html = f.read()

# Extract <head>
head_match = re.search(r"<head[^>]*>(.*?)</head>", html, re.DOTALL | re.IGNORECASE)
if head_match:
    with open(os.path.join(output_dir, "head.html"), "w", encoding="utf-8") as f:
        f.write(head_match.group(1))

# Extract <body>
body_match = re.search(r"<body[^>]*>(.*?)</body>", html, re.DOTALL | re.IGNORECASE)
if body_match:
    with open(os.path.join(output_dir, "body.html"), "w", encoding="utf-8") as f:
        f.write(body_match.group(1))

# Extract all <script> tags
scripts = re.findall(r"(<script[^>]*>.*?</script>)", html, re.DOTALL | re.IGNORECASE)
for i, script in enumerate(scripts):
    with open(os.path.join(output_dir, f"script_{i+1}.js"), "w", encoding="utf-8") as f:
        # Remove <script> tags for JS files, keep for HTML fragments
        js_content = re.sub(r"<\/?script[^>]*>", "", script, flags=re.IGNORECASE)
        f.write(js_content.strip())

# Extract all <style> tags
styles = re.findall(r"(<style[^>]*>.*?</style>)", html, re.DOTALL | re.IGNORECASE)
for i, style in enumerate(styles):
    with open(os.path.join(output_dir, f"style_{i+1}.css"), "w", encoding="utf-8") as f:
        css_content = re.sub(r"<\/?style[^>]*>", "", style, flags=re.IGNORECASE)
        f.write(css_content.strip())

# Save any remaining content (optional)
remaining = re.sub(r"<head[^>]*>.*?</head>", "", html, flags=re.DOTALL | re.IGNORECASE)
remaining = re.sub(r"<body[^>]*>.*?</body>", "", remaining, flags=re.DOTALL | re.IGNORECASE)
remaining = re.sub(r"<script[^>]*>.*?</script>", "", remaining, flags=re.DOTALL | re.IGNORECASE)
remaining = re.sub(r"<style[^>]*>.*?</style>", "", remaining, flags=re.DOTALL | re.IGNORECASE)
remaining = remaining.strip()
if remaining:
    with open(os.path.join(output_dir, "misc.html"), "w", encoding="utf-8") as f:
        f.write(remaining)

print(f"Splitting complete! Files are in '{output_dir}'")