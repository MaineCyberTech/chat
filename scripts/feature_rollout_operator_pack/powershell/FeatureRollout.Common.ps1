function Write-FeatureRolloutBanner {
    param([string]$Message)
    Write-Host ''
    Write-Host '=== Feature Rollout Operator Pack ==='
    Write-Host $Message
    Write-Host ''
}
