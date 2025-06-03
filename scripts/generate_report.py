import json
import os
from datetime import datetime
from typing import Dict, List

def load_verification_results() -> Dict:
    """Load all verification results."""
    results = {}
    
    # Load UI verification results
    if os.path.exists('ui_verification_results.json'):
        with open('ui_verification_results.json', 'r') as f:
            results['ui'] = json.load(f)
    
    # Load backend verification results
    if os.path.exists('backend_verification_results.json'):
        with open('backend_verification_results.json', 'r') as f:
            results['backend'] = json.load(f)
    
    # Load real data verification results
    if os.path.exists('real_data_verification_results.json'):
        with open('real_data_verification_results.json', 'r') as f:
            results['real_data'] = json.load(f)
    
    # Load design verification results
    if os.path.exists('design_verification_results.json'):
        with open('design_verification_results.json', 'r') as f:
            results['design'] = json.load(f)
    
    return results

def generate_html_report(results: Dict) -> str:
    """Generate HTML report from verification results."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>AI Sports Betting Analytics Platform - Verification Report</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1, h2, h3 {{
            color: #333;
        }}
        .section {{
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }}
        .pass {{
            color: #28a745;
        }}
        .fail {{
            color: #dc3545;
        }}
        .issues {{
            margin-left: 20px;
            color: #666;
        }}
        .timestamp {{
            color: #666;
            font-size: 0.9em;
            margin-bottom: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>AI Sports Betting Analytics Platform - Verification Report</h1>
        <div class="timestamp">Generated on: {timestamp}</div>
"""
    
    # Add UI verification results
    if 'ui' in results:
        html += """
        <div class="section">
            <h2>UI Verification</h2>
            <p>Overall Status: <span class="{}">{}</span></p>
""".format('pass' if results['ui']['overall_status'] else 'fail',
           'PASS' if results['ui']['overall_status'] else 'FAIL')
        
        for category in ['components', 'styles', 'data']:
            html += f"""
            <h3>{category.title()}</h3>"""
            for name, data in results['ui'][category].items():
                html += f"""
            <p>{name}: <span class="{'pass' if data['status'] else 'fail'}">{'PASS' if data['status'] else 'FAIL'}</span></p>"""
                if data['issues']:
                    html += """
            <div class="issues">
                <p>Issues:</p>
                <ul>"""
                    for issue in data['issues']:
                        html += f"""
                    <li>{issue}</li>"""
                    html += """
                </ul>
            </div>"""
        html += """
        </div>"""
    
    # Add backend verification results
    if 'backend' in results:
        html += """
        <div class="section">
            <h2>Backend Verification</h2>
            <p>Overall Status: <span class="{}">{}</span></p>
""".format('pass' if results['backend']['overall_status'] else 'fail',
           'PASS' if results['backend']['overall_status'] else 'FAIL')
        
        for category in ['endpoints', 'data_integration']:
            html += f"""
            <h3>{category.title()}</h3>"""
            for name, data in results['backend'][category].items():
                html += f"""
            <p>{name}: <span class="{'pass' if data['status'] else 'fail'}">{'PASS' if data['status'] else 'FAIL'}</span></p>"""
                if data['issues']:
                    html += """
            <div class="issues">
                <p>Issues:</p>
                <ul>"""
                    for issue in data['issues']:
                        html += f"""
                    <li>{issue}</li>"""
                    html += """
                </ul>
            </div>"""
        html += """
        </div>"""
    
    # Add real data verification results
    if 'real_data' in results:
        html += """
        <div class="section">
            <h2>Real Data Verification</h2>
            <p>Overall Status: <span class="{}">{}</span></p>
""".format('pass' if results['real_data']['overall_status'] else 'fail',
           'PASS' if results['real_data']['overall_status'] else 'FAIL')
        
        for category in ['components', 'services']:
            html += f"""
            <h3>{category.title()}</h3>"""
            for name, data in results['real_data'][category].items():
                html += f"""
            <p>{name}: <span class="{'pass' if data['status'] else 'fail'}">{'PASS' if data['status'] else 'FAIL'}</span></p>"""
                if data['issues']:
                    html += """
            <div class="issues">
                <p>Issues:</p>
                <ul>"""
                    for issue in data['issues']:
                        html += f"""
                    <li>{issue}</li>"""
                    html += """
                </ul>
            </div>"""
        html += """
        </div>"""
    
    # Add design verification results
    if 'design' in results:
        html += """
        <div class="section">
            <h2>Design Verification</h2>
            <p>Overall Status: <span class="{}">{}</span></p>
""".format('pass' if results['design']['overall_status'] else 'fail',
           'PASS' if results['design']['overall_status'] else 'FAIL')
        
        for category in ['layout', 'styles', 'components']:
            html += f"""
            <h3>{category.title()}</h3>"""
            for name, data in results['design'][category].items():
                html += f"""
            <p>{name}: <span class="{'pass' if data['status'] else 'fail'}">{'PASS' if data['status'] else 'FAIL'}</span></p>"""
                if data['issues']:
                    html += """
            <div class="issues">
                <p>Issues:</p>
                <ul>"""
                    for issue in data['issues']:
                        html += f"""
                    <li>{issue}</li>"""
                    html += """
                </ul>
            </div>"""
        html += """
        </div>"""
    
    html += """
    </div>
</body>
</html>"""
    
    return html

def main():
    # Load verification results
    results = load_verification_results()
    
    # Generate HTML report
    html = generate_html_report(results)
    
    # Save report
    with open('verification_report.html', 'w') as f:
        f.write(html)
    
    print("\nVerification report generated: verification_report.html")

if __name__ == "__main__":
    main() 