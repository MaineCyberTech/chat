import re

for path in ['.github/workflows/deploy-development.yml', '.github/workflows/deploy-production.yml']:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix the LIVEKIT injection that broke YAML
    old = """            if [ -n "${{ secrets.VAPID_PUBLIC_KEY }}" ]; then
              echo "LIVEKIT_API_KEY=${{ secrets.LIVEKIT_API_KEY }}
          LIVEKIT_API_SECRET=${{ secrets.LIVEKIT_API_SECRET }}
          VAPID_PUBLIC_KEY=${{ secrets.VAPID_PUBLIC_KEY }}" >> ${{ env.REPO_DIR }}/.env
            fi"""
    
    new = """            if [ -n "${{ secrets.LIVEKIT_API_KEY }}" ]; then
              echo "LIVEKIT_API_KEY=${{ secrets.LIVEKIT_API_KEY }}" >> ${{ env.REPO_DIR }}/.env
              echo "LIVEKIT_API_SECRET=${{ secrets.LIVEKIT_API_SECRET }}" >> ${{ env.REPO_DIR }}/.env
            fi
            if [ -n "${{ secrets.VAPID_PUBLIC_KEY }}" ]; then
              echo "VAPID_PUBLIC_KEY=${{ secrets.VAPID_PUBLIC_KEY }}" >> ${{ env.REPO_DIR }}/.env
            fi"""
    
    if old in content:
        content = content.replace(old, new)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: {path}')
    else:
        print(f'Pattern not found in: {path}')
        # Show what's around LIVEKIT in the file
        if 'LIVEKIT' in content:
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'LIVEKIT' in line:
                    start = max(0, i-2)
                    end = min(len(lines), i+4)
                    for j in range(start, end):
                        print(f'  {j+1}: {lines[j]}')
