import re
for path in ['.github/workflows/deploy-development.yml', '.github/workflows/deploy-production.yml']:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'LIVEKIT_API_KEY' not in content:
        content = content.replace(
            'VAPID_PUBLIC_KEY=${{ secrets.VAPID_PUBLIC_KEY }}',
            'LIVEKIT_API_KEY=${{ secrets.LIVEKIT_API_KEY }}\n          LIVEKIT_API_SECRET=${{ secrets.LIVEKIT_API_SECRET }}\n          VAPID_PUBLIC_KEY=${{ secrets.VAPID_PUBLIC_KEY }}'
        )
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated: {path}')
    else:
        print(f'Already has LIVEKIT: {path}')
