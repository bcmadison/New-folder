from bs4 import BeautifulSoup
import re
import os
from typing import List, Dict

def extract_messages(text: str) -> List[str]:
    # Try to split by common chat delimiters (timestamps, 'User:', 'Assistant:', etc.)
    # Add more patterns as needed
    patterns = [
        r'\d{1,2}:\d{2}\s*(AM|PM)?\s*-',  # e.g., 12:34 PM -
        r'User:',
        r'Assistant:',
        r'\n{2,}',  # double newlines
    ]
    regex = re.compile('|'.join(patterns))
    # Split and filter out None values before stripping
    splits = regex.split(text)
    return [s.strip() for s in splits if s and isinstance(s, str) and s.strip()]

def analyze_for_copilot(messages: List[str]) -> Dict[str, List[str]]:
    # Heuristics for actionable/technical content
    features, todos, bugs, code, design, other = [], [], [], [], [], []
    for msg in messages:
        lower = msg.lower()
        if any(x in lower for x in ['feature', 'add ', 'implement', 'support', 'request']):
            features.append(msg)
        elif any(x in lower for x in ['todo', 'to do', 'next step', 'should ', 'need to']):
            todos.append(msg)
        elif any(x in lower for x in ['bug', 'issue', 'error', 'fix', 'problem']):
            bugs.append(msg)
        elif re.search(r'```|def |class |import |<.*?>', msg):
            code.append(msg)
        elif any(x in lower for x in ['design', 'architecture', 'structure', 'flow']):
            design.append(msg)
        else:
            other.append(msg)
    return {
        'Features/Requests': features,
        'TODOs/Requirements': todos,
        'Bugs/Issues': bugs,
        'Code/Technical Notes': code,
        'Design/Architecture': design,
        'Other/General Discussion': other
    }

def write_markdown_summary(analysis: Dict[str, List[str]], output_path: str) -> None:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('# Chat Summary for Copilot Implementation\n\n')
        for section, items in analysis.items():
            f.write(f'## {section}\n')
            if items:
                for item in items:
                    f.write(f'- {item}\n')
            else:
                f.write('_(None found)_\n')
            f.write('\n')

def analyze_chat_html(file_path: str) -> None:
    print(f"Analyzing chat file: {file_path}")
    print(f"File size: {os.path.getsize(file_path) / (1024*1024):.2f} MB")
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Parse HTML
    soup = BeautifulSoup(content, 'html.parser')
    text_content = soup.get_text(separator='\n')
    
    # Print the first 200 lines of the extracted text for inspection
    print("\n--- BEGIN RAW TEXT SAMPLE (first 200 lines) ---\n")
    for i, line in enumerate(text_content.splitlines()):
        if i < 200:
            print(f"{i+1:03}: {line}")
        else:
            break
    print("\n--- END RAW TEXT SAMPLE ---\n")
    
    # Extract and segment messages
    messages = extract_messages(text_content)
    print(f"Extracted {len(messages)} message blocks.")
    
    # Analyze for actionable/technical content
    analysis = analyze_for_copilot(messages)
    
    # Write Markdown summary
    write_markdown_summary(analysis, 'chat_summary.md')
    print("\nComprehensive Markdown summary saved to 'chat_summary.md'.")

if __name__ == "__main__":
    chat_file = "finalApp/chat.html"
    analyze_chat_html(chat_file) 