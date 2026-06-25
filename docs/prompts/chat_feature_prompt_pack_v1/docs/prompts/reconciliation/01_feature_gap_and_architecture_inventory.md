# Feature Gap and Architecture Inventory Prompt

You are a principal software architect analyzing the current chat application repository.

## Objective

Determine how far the repository is from supporting the target feature set and identify the safest incremental path to get there.

## Analyze

- current message model and channel model
- current workspace and membership model
- current permissions and role model
- current search support or indexing support
- current notification and mention handling
- current editor/message input architecture
- current virtualization state in message lists
- current media / WebRTC support and session state

## Output format

1. Existing capability matrix
   - feature
   - current status: present / partial / absent
   - evidence (file paths)
2. Missing backend primitives
3. Missing DB primitives
4. Missing frontend primitives
5. Recommended implementation order
6. P0/P1 risks if implemented incorrectly

## Write to

`/docs/audits/latest/feature_gap_inventory.md`
