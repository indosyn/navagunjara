$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'

function Hit($label, $params) {
  Write-Host ""
  Write-Host "=== $label ===" -ForegroundColor Cyan
  try {
    $r = Invoke-WebRequest @params -UseBasicParsing -ErrorAction Stop
    Write-Host "STATUS $($r.StatusCode)" -ForegroundColor Green
    $c = $r.Content
    if ($c.Length -gt 400) { $c = $c.Substring(0,400) + '...' }
    Write-Host $c
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "STATUS $code" -ForegroundColor Red
    if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }
  }
}

# --- LOGIN ADMIN ---
$la = Invoke-RestMethod -Uri "$base/api/v1/auth/login" -Method POST -ContentType 'application/json' -Body '{"email":"admin@navagunjara.com","password":"Admin@123"}'
$tokenAdmin = $la.data.token
$Hadmin = @{ Authorization = "Bearer $tokenAdmin" }
Write-Host "Admin token acquired (role=$($la.data.role))" -ForegroundColor Yellow

Hit 'GET /admin/dashboard'        @{ Uri="$base/api/v1/admin/dashboard"; Headers=$Hadmin; Method='GET' }
Hit 'GET /customers (admin)'      @{ Uri="$base/api/v1/customers?page=0&size=2"; Headers=$Hadmin; Method='GET' }
Hit 'GET /orders (admin)'         @{ Uri="$base/api/v1/orders?page=0&size=2"; Headers=$Hadmin; Method='GET' }
Hit 'GET /jewelry (public)'       @{ Uri="$base/api/v1/jewelry?page=0&size=2"; Method='GET' }
Hit 'GET /clothing (public)'      @{ Uri="$base/api/v1/clothing?page=0&size=2"; Method='GET' }
Hit 'POST /jewelry (admin)'       @{ Uri="$base/api/v1/jewelry"; Headers=$Hadmin; Method='POST'; ContentType='application/json'; Body='{"name":"Smoke Necklace","description":"smoke","price":1234,"stockQuantity":1,"jewelleryType":"NECKLACE","material":"Test","weightGrams":1.5}' }
Hit 'POST /clothing (admin)'      @{ Uri="$base/api/v1/clothing"; Headers=$Hadmin; Method='POST'; ContentType='application/json'; Body='{"name":"Smoke Kurta","description":"smoke","price":555,"stockQuantity":1,"clothingType":"KURTA","size":"M","color":"Blue","gender":"MALE"}' }

# --- LOGIN CUSTOMER ---
Write-Host ""
$lc = Invoke-RestMethod -Uri "$base/api/v1/auth/login" -Method POST -ContentType 'application/json' -Body '{"email":"priya@example.com","password":"Customer@123"}'
$tokenCust = $lc.data.token
$Hcust = @{ Authorization = "Bearer $tokenCust" }
Write-Host "Customer token acquired (role=$($lc.data.role), id=$($lc.data.id))" -ForegroundColor Yellow

Hit 'GET /customers/me'           @{ Uri="$base/api/v1/customers/me"; Headers=$Hcust; Method='GET' }
Hit 'GET /wishlist'               @{ Uri="$base/api/v1/wishlist"; Headers=$Hcust; Method='GET' }
Hit 'GET /orders (customer)'      @{ Uri="$base/api/v1/orders?page=0&size=2"; Headers=$Hcust; Method='GET' }

# --- NO TOKEN (should 401, NOT 403/500) ---
Hit 'GET /customers/me NO-AUTH'   @{ Uri="$base/api/v1/customers/me"; Method='GET' }
Hit 'POST /jewelry NO-AUTH'       @{ Uri="$base/api/v1/jewelry"; Method='POST'; ContentType='application/json'; Body='{"name":"x","description":"x","price":1,"stockQuantity":1,"jewelleryType":"NECKLACE","material":"x","weightGrams":1}' }
