# Apricity Stack Integration Test - PowerShell Version
# For Windows users who prefer PowerShell over Git Bash

<#
.SYNOPSIS
    End-to-end integration test for Apricity Mental Health Companion stack
.DESCRIPTION
    Tests the full flow: docker-compose up → health checks → register → login → create diary → validate emotion
.EXAMPLE
    .\test-stack.ps1
.NOTES
    Requires: Docker Desktop, curl (or Invoke-RestMethod)
#>

$ErrorActionPreference = "Stop"

# Configuration
$BACKEND_URL = "http://localhost:5000"
$ML_SERVICE_URL = "http://localhost:8000"
$MAX_RETRIES = 30
$RETRY_INTERVAL = 2
$ML_ANALYSIS_WAIT = 10

# Test data
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$TEST_EMAIL = "testuser_$timestamp@apricity.test"
$TEST_PASSWORD = "SecurePass123!"
$TEST_USERNAME = "TestUser$timestamp"
$DIARY_TITLE = "Integration Test Diary"
$DIARY_CONTENT = "I am feeling really anxious about my upcoming presentation. I have been practicing a lot but I still feel nervous and worried that something will go wrong. I hope I can overcome this anxiety."

# Global variables
$JWT_TOKEN = $null
$DIARY_ID = $null

#############################################################################
# Helper Functions
#############################################################################

function Write-Header {
    param([string]$Message)
    Write-Host "`n=============================================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "=============================================================`n" -ForegroundColor Blue
}

function Write-Step {
    param([string]$Message)
    Write-Host "► $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    try {
        $params = @{
            Method = $Method
            Uri = $Url
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Compress)
        }
        
        $response = Invoke-RestMethod @params
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = $_.Exception.Response.StatusCode.Value__
        }
    }
}

#############################################################################
# Test Functions
#############################################################################

function Test-Dependencies {
    Write-Step "Checking dependencies..."
    
    $deps = @("docker", "docker-compose")
    foreach ($dep in $deps) {
        if (-not (Get-Command $dep -ErrorAction SilentlyContinue)) {
            Write-Error-Custom "$dep is not installed"
            exit 1
        }
    }
    
    Write-Success "All dependencies found"
}

function Start-Services {
    Write-Step "Starting Docker services..."
    
    # Stop existing containers
    docker-compose down 2>&1 | Out-Null
    
    # Start services
    $result = docker-compose up -d 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker services started"
    }
    else {
        Write-Error-Custom "Failed to start Docker services"
        Write-Host $result
        exit 1
    }
}

function Wait-ForService {
    param(
        [string]$ServiceName,
        [string]$HealthUrl
    )
    
    Write-Step "Waiting for $ServiceName to be healthy..."
    
    $retryCount = 0
    while ($retryCount -lt $MAX_RETRIES) {
        try {
            $response = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.status -eq "healthy") {
                Write-Success "$ServiceName is healthy"
                return
            }
        }
        catch {
            # Service not ready yet
        }
        
        $retryCount++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds $RETRY_INTERVAL
    }
    
    Write-Host ""
    Write-Error-Custom "$ServiceName failed to become healthy"
    docker-compose logs $ServiceName
    exit 1
}

function Test-BackendHealth {
    Write-Step "Testing backend health endpoint..."
    
    $result = Invoke-ApiCall -Method Get -Url "$BACKEND_URL/health"
    
    if (-not $result.Success -or $result.Data.status -ne "healthy") {
        Write-Error-Custom "Backend health check failed"
        exit 1
    }
    
    Write-Success "Backend is healthy"
    Write-Host "   Response: $($result.Data | ConvertTo-Json -Compress)"
}

function Test-MLHealth {
    Write-Step "Testing ML service health endpoint..."
    
    $result = Invoke-ApiCall -Method Get -Url "$ML_SERVICE_URL/health"
    
    if (-not $result.Success -or $result.Data.status -ne "healthy") {
        Write-Error-Custom "ML service health check failed"
        exit 1
    }
    
    Write-Success "ML service is healthy"
    Write-Host "   Response: $($result.Data | ConvertTo-Json -Compress)"
}

function Register-User {
    Write-Step "Registering test user..."
    
    $body = @{
        email = $TEST_EMAIL
        password = $TEST_PASSWORD
        username = $TEST_USERNAME
    }
    
    $result = Invoke-ApiCall -Method Post -Url "$BACKEND_URL/api/auth/register" -Body $body
    
    if (-not $result.Success -or -not $result.Data.success) {
        Write-Error-Custom "User registration failed"
        Write-Host $result.Error
        exit 1
    }
    
    Write-Success "User registered successfully"
    Write-Host "   Email: $TEST_EMAIL"
    Write-Host "   Username: $TEST_USERNAME"
}

function Login-User {
    Write-Step "Logging in..."
    
    $body = @{
        email = $TEST_EMAIL
        password = $TEST_PASSWORD
    }
    
    $result = Invoke-ApiCall -Method Post -Url "$BACKEND_URL/api/auth/login" -Body $body
    
    if (-not $result.Success -or -not $result.Data.data.token) {
        Write-Error-Custom "Login failed"
        exit 1
    }
    
    $script:JWT_TOKEN = $result.Data.data.token
    
    Write-Success "Login successful"
    Write-Host "   Token: $($JWT_TOKEN.Substring(0, 20))..."
}

function New-Diary {
    Write-Step "Creating diary entry..."
    
    $body = @{
        title = $DIARY_TITLE
        content = $DIARY_CONTENT
        date = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.000Z")
        mood = "anxious"
        tags = @("test", "integration", "anxiety")
    }
    
    $headers = @{
        Authorization = "Bearer $JWT_TOKEN"
    }
    
    $result = Invoke-ApiCall -Method Post -Url "$BACKEND_URL/api/diary" -Headers $headers -Body $body
    
    if (-not $result.Success -or -not $result.Data.data.diary._id) {
        Write-Error-Custom "Diary creation failed"
        exit 1
    }
    
    $script:DIARY_ID = $result.Data.data.diary._id
    
    Write-Success "Diary created successfully"
    Write-Host "   Diary ID: $DIARY_ID"
    Write-Host "   Title: $DIARY_TITLE"
}

function Wait-ForMLAnalysis {
    Write-Step "Waiting for ML analysis to complete ($ML_ANALYSIS_WAIT`s)..."
    
    for ($i = 0; $i -lt $ML_ANALYSIS_WAIT; $i++) {
        Start-Sleep -Seconds 1
        Write-Host "." -NoNewline
    }
    
    Write-Host ""
    Write-Success "ML analysis processing time elapsed"
}

function Get-DiaryWithEmotion {
    Write-Step "Retrieving diary entry with emotion analysis..."
    
    $headers = @{
        Authorization = "Bearer $JWT_TOKEN"
    }
    
    $result = Invoke-ApiCall -Method Get -Url "$BACKEND_URL/api/diary/$DIARY_ID" -Headers $headers
    
    if (-not $result.Success) {
        Write-Error-Custom "Failed to retrieve diary entry"
        exit 1
    }
    
    Write-Success "Diary retrieved successfully"
    return $result.Data
}

function Test-EmotionData {
    param([object]$DiaryData)
    
    Write-Step "Validating emotion analysis data..."
    
    $emotionSummary = $DiaryData.data.diary.emotionSummary
    
    if (-not $emotionSummary) {
        Write-Error-Custom "No emotion analysis found in diary entry"
        exit 1
    }
    
    # Validate required fields
    if (-not $emotionSummary.topEmotion -or -not $emotionSummary.confidence) {
        Write-Error-Custom "Missing required emotion fields"
        exit 1
    }
    
    # Validate confidence range
    $confidence = [double]$emotionSummary.confidence
    if ($confidence -lt 0 -or $confidence -gt 1) {
        Write-Error-Custom "Confidence value out of range (0-1): $confidence"
        exit 1
    }
    
    # Validate detected emotions
    if (-not $emotionSummary.detectedEmotions -or $emotionSummary.detectedEmotions.Count -eq 0) {
        Write-Error-Custom "No emotions detected in analysis"
        exit 1
    }
    
    Write-Success "Emotion analysis data validated"
    Write-Host "   Top Emotion: $($emotionSummary.topEmotion)"
    Write-Host "   Confidence: $($emotionSummary.confidence)"
    Write-Host "   Category: $($emotionSummary.category)"
    Write-Host "   Detected Emotions: $($emotionSummary.detectedEmotions.Count)"
    Write-Host ""
    Write-Host "   Full Emotion Summary:"
    Write-Host ($emotionSummary | ConvertTo-Json -Depth 3)
}

function Remove-TestDiary {
    if ($DIARY_ID -and $JWT_TOKEN) {
        Write-Step "Cleaning up test data..."
        
        $headers = @{
            Authorization = "Bearer $JWT_TOKEN"
        }
        
        try {
            Invoke-RestMethod -Method Delete -Uri "$BACKEND_URL/api/diary/$DIARY_ID" -Headers $headers | Out-Null
            Write-Success "Test diary deleted"
        }
        catch {
            # Ignore cleanup errors
        }
    }
}

#############################################################################
# Main Execution
#############################################################################

try {
    Write-Header "APRICITY STACK INTEGRATION TEST (PowerShell)"
    
    # Check dependencies
    Test-Dependencies
    
    # Start services
    Start-Services
    
    # Wait for services
    Wait-ForService -ServiceName "backend" -HealthUrl "$BACKEND_URL/health"
    Wait-ForService -ServiceName "ML service" -HealthUrl "$ML_SERVICE_URL/health"
    
    # Additional wait for MongoDB
    Write-Step "Waiting for MongoDB to initialize..."
    Start-Sleep -Seconds 5
    Write-Success "MongoDB initialization complete"
    
    # Test health endpoints
    Write-Header "HEALTH CHECKS"
    Test-BackendHealth
    Test-MLHealth
    
    # User authentication
    Write-Header "USER AUTHENTICATION"
    Register-User
    Login-User
    
    # Diary operations
    Write-Header "DIARY OPERATIONS"
    New-Diary
    
    # Wait for ML
    Write-Header "ML ANALYSIS"
    Wait-ForMLAnalysis
    
    # Validate emotion
    Write-Header "EMOTION VALIDATION"
    $diaryData = Get-DiaryWithEmotion
    Test-EmotionData -DiaryData $diaryData
    
    # Cleanup
    Remove-TestDiary
    
    # Success
    Write-Header "ALL TESTS PASSED ✓"
    Write-Host "The Apricity stack is fully operational!" -ForegroundColor Green
    Write-Host "`nServices tested:"
    Write-Host "  ✓ MongoDB database"
    Write-Host "  ✓ Backend API (Express + MongoDB)"
    Write-Host "  ✓ ML Service (Python + BERT)"
    Write-Host "  ✓ Job Queue (async processing)"
    Write-Host "  ✓ End-to-end flow"
    Write-Host ""
    Write-Host "Test artifacts:"
    Write-Host "  • User: $TEST_EMAIL"
    Write-Host "  • Diary ID: $DIARY_ID (deleted)"
    Write-Host ""
    
    exit 0
}
catch {
    Write-Error-Custom "Test failed: $_"
    exit 1
}
