"""Verify which medium-effort Mattermost features are already implemented."""
from pathlib import Path

checks = {
    "Category management (create/rename/delete/reorder)": [
        ("app-sidebar.tsx", "createCategory"),
        ("app-sidebar.tsx", "renameCategory"),
        ("app-sidebar.tsx", "deleteCategory"),
        ("sidebar/routes.ts", "PATCH.*reorder"),
    ],
    "Channel context menu (right-click)": [
        ("channel-list.tsx", "contextMenu"),
        ("channel-list.tsx", "Favorite"),
        ("channel-list.tsx", "Mute"),
    ],
    "Sidebar header team menu": [
        ("app-sidebar.tsx", "showTeamMenu"),
        ("app-sidebar.tsx", "teamMenuRef"),
    ],
    "Resizable sidebar (drag handle)": [
        ("layout.tsx", "sidebarWidth"),
        ("layout.tsx", "handleMouseDown"),
    ],
    "Search operator hints": [
        ("search-bar.tsx", "operatorHint"),
        ("search-bar.tsx", "from:"),
    ],
    "File extension suggestions": [
        ("search-bar.tsx", "fileExtSuggest"),
    ],
    "Global notification settings page": [
        ("settings/page.tsx", "notification_sound"),
        ("settings/page.tsx", "desktop_notifications"),
    ],
    "Trigger words + auto-responder": [
        ("notification/routes.ts", "trigger_word"),
    ],
}

print("=== Medium-Effort Feature Status ===\n")

for feature, patterns in checks.items():
    found = 0
    for filename, pattern in patterns:
        for f in sorted(Path("apps/web").rglob(filename)):
            content = f.read_text(encoding="utf-8", errors="replace")
            if pattern in content:
                found += 1
                break
    
    status = "DONE" if len([p for p in patterns if any(p[0] in str(f) for f in Path('apps/web').rglob(p[0]) for _ in [0] if p[1] in open(f,encoding='utf-8',errors='replace').read())]) == len(patterns) else "NEEDS WORK"
    if status == "DONE" and found > 0:
        pass
    print(f"  [{status}] {feature}")
