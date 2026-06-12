import os
import shutil

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    src_dir = os.path.join(base_dir, 'src')
    
    layout_path = os.path.join(src_dir, 'layout.html')
    tickets_dir = os.path.join(src_dir, 'tickets')
    
    if not os.path.exists(layout_path):
        print(f"Error: {layout_path} not found.")
        return

    with open(layout_path, 'r', encoding='utf-8') as f:
        layout_html = f.read()

    # Read and concatenate tickets
    ticket_files = sorted([f for f in os.listdir(tickets_dir) if f.endswith('.html')])
    tickets_content = []
    
    for tf in ticket_files:
        with open(os.path.join(tickets_dir, tf), 'r', encoding='utf-8') as f:
            tickets_content.append(f.read())
            
    all_tickets_html = "\n".join(tickets_content)
    
    # Inject tickets into layout
    final_html = layout_html.replace('<!-- TICKETS_CONTENT -->', all_tickets_html)
    
    # Write final index.html
    index_path = os.path.join(base_dir, 'index.html')
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(final_html)
        
    print(f"Successfully assembled {index_path}")
    
    # Copy css and js to root for static serving
    for folder in ['css', 'js']:
        src_folder = os.path.join(src_dir, folder)
        dest_folder = os.path.join(base_dir, folder)
        
        if os.path.exists(src_folder):
            if os.path.exists(dest_folder):
                shutil.rmtree(dest_folder)
            shutil.copytree(src_folder, dest_folder)
            print(f"Copied {src_folder} to {dest_folder}")

if __name__ == "__main__":
    main()
