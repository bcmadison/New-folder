from bs4 import BeautifulSoup
import json
import re
import os

def extract_chat_content_robust(html_file_path, output_file_path='extracted_chat.txt'):
    """
    Robust extraction that handles malformed JSON and HTML issues
    """
    
    print(f"Reading HTML file: {html_file_path}")
    
    # Read the HTML file
    with open(html_file_path, 'r', encoding='utf-8', errors='ignore') as file:
        html_content = file.read()
    
    print(f"HTML file size: {len(html_content):,} characters")
    
    # First, try to extract the JSON data directly using regex
    try:
        # Look for the jsonData variable
        json_match = re.search(r'var jsonData = (\[.*?\]);', html_content, re.DOTALL)
        
        if json_match:
            json_str = json_match.group(1)
            
            # Try to parse the JSON
            try:
                conversations = json.loads(json_str)
                print(f"Successfully parsed {len(conversations)} conversations")
                process_conversations(conversations, output_file_path)
                return
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}")
                print("JSON might be truncated. Attempting partial extraction...")
                
                # Try to extract what we can from the JSON string
                extract_partial_json(json_str, output_file_path)
                return
    except Exception as e:
        print(f"Error during JSON extraction: {e}")
    
    # If JSON extraction fails, use HTML parsing
    print("Attempting HTML-based extraction...")
    soup = BeautifulSoup(html_content, 'html.parser')
    extract_from_html_structure(soup, output_file_path)

def extract_partial_json(json_str, output_file_path):
    """
    Extract what we can from a partially valid JSON string
    """
    with open(output_file_path, 'w', encoding='utf-8') as output:
        output.write("=== EXTRACTED CHAT CONTENT (Partial JSON) ===\n\n")
        
        # Extract user messages
        user_pattern = r'"author":\s*\{[^}]*"role":\s*"user"[^}]*\}[^}]*"content":\s*\{[^}]*"parts":\s*\[(.*?)\]'
        user_matches = re.findall(user_pattern, json_str, re.DOTALL)
        
        print(f"Found {len(user_matches)} user messages")
        
        for idx, match in enumerate(user_matches):
            try:
                # Clean up the content
                content = match.strip()
                if content.startswith('"') and content.endswith('"'):
                    content = content[1:-1]
                content = content.replace('\\n', '\n').replace('\\"', '"').replace('\\\'', "'")
                
                output.write(f"\n[USER MESSAGE {idx + 1}]:\n")
                output.write(f"{content}\n")
                output.write("-" * 50 + "\n")
            except:
                continue
        
        # Extract assistant messages
        assistant_pattern = r'"author":\s*\{[^}]*"role":\s*"assistant"[^}]*\}[^}]*"content":\s*\{[^}]*"parts":\s*\[(.*?)\]'
        assistant_matches = re.findall(assistant_pattern, json_str, re.DOTALL)
        
        print(f"Found {len(assistant_matches)} assistant messages")
        
        for idx, match in enumerate(assistant_matches):
            try:
                # Clean up the content
                content = match.strip()
                if content.startswith('"') and content.endswith('"'):
                    content = content[1:-1]
                content = content.replace('\\n', '\n').replace('\\"', '"').replace('\\\'', "'")
                
                output.write(f"\n[ASSISTANT MESSAGE {idx + 1}]:\n")
                output.write(f"{content}\n")
                output.write("-" * 50 + "\n")
            except:
                continue
    
    print(f"Partial extraction complete: {output_file_path}")
    print(f"File size: {os.path.getsize(output_file_path) / 1024:.2f} KB")

def extract_from_html_structure(soup, output_file_path):
    """
    Fallback method: Extract content directly from HTML structure
    """
    print("Using fallback HTML extraction method...")
    
    with open(output_file_path, 'w', encoding='utf-8') as output:
        output.write("=== EXTRACTED CHAT CONTENT (HTML Method) ===\n\n")
        
        # Look for message containers
        messages = soup.find_all(class_='message')
        
        if messages:
            print(f"Found {len(messages)} message elements")
            for idx, msg in enumerate(messages):
                author = msg.find(class_='author')
                content = msg.get_text(strip=True)
                
                if content:
                    output.write(f"\n[MESSAGE {idx + 1}]:\n")
                    if author:
                        output.write(f"Author: {author.get_text(strip=True)}\n")
                    output.write(f"{content}\n")
                    output.write("-" * 50 + "\n")
        else:
            # Extract all text content
            print("Extracting all text content...")
            all_text = soup.get_text(separator='\n', strip=True)
            output.write(all_text)
        
        output.write(f"\n\nExtraction complete. Output saved to: {output_file_path}\n")
    
    print(f"Content extracted to: {output_file_path}")
    print(f"File size: {os.path.getsize(output_file_path) / 1024:.2f} KB")

def process_conversations(conversations, output_file_path):
    """
    Process parsed conversation data
    """
    with open(output_file_path, 'w', encoding='utf-8') as output:
        output.write("=== EXTRACTED CHAT CONTENT ===\n\n")
        
        for conv_idx, conversation in enumerate(conversations):
            output.write(f"\n{'='*50}\n")
            output.write(f"CONVERSATION {conv_idx + 1}: {conversation.get('title', 'Untitled')}\n")
            output.write(f"{'='*50}\n\n")
            
            # Extract messages from mapping
            mapping = conversation.get('mapping', {})
            
            # Build message chain
            messages = []
            for node_id, node_data in mapping.items():
                if node_data and node_data.get('message'):
                    message = node_data['message']
                    author_role = message.get('author', {}).get('role', 'unknown')
                    content = message.get('content', {})
                    
                    # Extract text content
                    text_parts = content.get('parts', [])
                    text_content = '\n'.join(str(part) for part in text_parts if part)
                    
                    if text_content and author_role in ['user', 'assistant']:
                        messages.append({
                            'role': author_role,
                            'content': text_content,
                            'create_time': message.get('create_time', 0)
                        })
            
            # Sort messages by creation time
            if messages:
                messages.sort(key=lambda x: x['create_time'])
            
            # Write messages
            for msg in messages:
                output.write(f"\n[{msg['role'].upper()}]:\n")
                output.write(f"{msg['content']}\n")
                output.write("-" * 30 + "\n")
        
        output.write(f"\n\nTotal conversations extracted: {len(conversations)}\n")
    
    print(f"Content extracted successfully to: {output_file_path}")
    print(f"File size: {os.path.getsize(output_file_path) / 1024:.2f} KB")

def simple_extract(html_file='chat.html', output_file='simple_extract.txt'):
    """
    Simple extraction focusing on visible text content
    """
    with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Remove script and style tags
    content = re.sub(r'<script.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<style.*?</style>', '', content, flags=re.DOTALL)
    
    # Remove HTML tags
    content = re.sub(r'<[^>]+>', '\n', content)
    
    # Decode HTML entities
    content = content.replace('&quot;', '"').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&#x27;', "'")
    
    # Clean up whitespace
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"Simple extraction complete: {output_file}")
    print(f"File size: {os.path.getsize(output_file) / 1024:.2f} KB")

def create_cursor_chunks(input_file='extracted_chat.txt', chunk_size=10000):
    """
    Split the extracted content into smaller chunks for Cursor
    """
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found!")
        return
    
    with open(input_file, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Create chunks directory
    chunks_dir = 'cursor_chunks'
    if not os.path.exists(chunks_dir):
        os.makedirs(chunks_dir)
    
    # Split into chunks
    total_chunks = (len(content) + chunk_size - 1) // chunk_size
    
    for i in range(total_chunks):
        start = i * chunk_size
        end = min((i + 1) * chunk_size, len(content))
        chunk = content[start:end]
        
        chunk_file = os.path.join(chunks_dir, f'chunk_{i+1:03d}.txt')
        with open(chunk_file, 'w', encoding='utf-8') as f:
            f.write(f"=== CHUNK {i+1} of {total_chunks} ===\n")
            f.write(f"Characters {start+1} to {end}\n\n")
            f.write(chunk)
        
        print(f"Created {chunk_file} ({len(chunk)} characters)")
    
    print(f"\nTotal chunks created: {total_chunks}")
    print(f"Chunks saved in: {chunks_dir}/")
    print("\nYou can now paste each chunk into Cursor Copilot")

# Main execution
if __name__ == "__main__":
    html_file = 'chat.html'
    
    if not os.path.exists(html_file):
        print(f"Error: {html_file} not found in current directory!")
        print(f"Current directory: {os.getcwd()}")
        exit(1)
    
    print("Starting extraction process...\n")
    
    # Try the robust method first
    extract_chat_content_robust(html_file, 'extracted_chat.txt')
    
    # Also try simple extraction as backup
    simple_extract(html_file, 'simple_extract.txt')
    
    # Create chunks from the best available file
    if os.path.exists('extracted_chat.txt') and os.path.getsize('extracted_chat.txt') > 1000:
        print("\nCreating chunks from extracted_chat.txt...")
        create_cursor_chunks('extracted_chat.txt')
    elif os.path.exists('simple_extract.txt') and os.path.getsize('simple_extract.txt') > 1000:
        print("\nCreating chunks from simple_extract.txt...")
        create_cursor_chunks('simple_extract.txt')
    else:
        print("\nWarning: Extracted files are too small. The HTML might not contain expected content.")