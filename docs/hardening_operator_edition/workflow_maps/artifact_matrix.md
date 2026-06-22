# Artifact Matrix

| Phase        | Required Inputs                         | Required Outputs                               |
| ------------ | --------------------------------------- | ---------------------------------------------- |
| Phase 0      | current repo state, branch, environment | preflight notes, selected policy               |
| Phase 1      | repo + domain prompts                   | domain reports, risk register updates          |
| Phase 2      | repo + confidence prompts               | additional domain reports, confidence notes    |
| Phase 3      | state of backups/tests/ops              | resilience findings, recovery notes            |
| Phase 4      | governance prompts                      | release notes draft, stakeholder summary       |
| RC Gate      | current run summary + RC policy         | gate result, RC decision                       |
| Prod Gate    | current run summary + prod policy       | promotion gate result, promotion decision      |
| Post-release | deployed release                        | validation notes, release stabilization status |
