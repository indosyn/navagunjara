function J($u, $m='GET', $b=$null, $H=$null) {
  try {
    $p=@{Uri=$u;Method=$m;UseBasicParsing=$true}
    if($H){$p.Headers=$H}
    if($b){$p.ContentType='application/json';$p.Body=$b}
    $r=Invoke-WebRequest @p
    Write-Host "[$($r.StatusCode)] $u" -ForegroundColor Green
    Write-Host $r.Content
  } catch {
    Write-Host "[$($_.Exception.Response.StatusCode.value__)] $u" -ForegroundColor Red
    if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }
  }
}

$la = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"admin@navagunjara.com","password":"Admin@123"}'
$A=@{Authorization="Bearer $($la.data.token)"}
$lc = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"priya@example.com","password":"Customer@123"}'
$C=@{Authorization="Bearer $($lc.data.token)"}

Write-Host "=== HEALTH ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/health'
Write-Host "=== JEWELRY SEARCH ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/jewelry/search?q=necklace'
Write-Host "=== CLOTHING SEARCH ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/clothing/search?q=saree'
Write-Host "=== GET JEWELRY BY ID ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/jewelry/1'
Write-Host "=== GET CLOTHING BY ID ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/clothing/9'
Write-Host "=== GET CUSTOMER BY ID ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/customers/2' 'GET' $null $A
Write-Host "=== REVIEWS LIST ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/reviews?productId=1'
Write-Host "=== ADD WISHLIST ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/wishlist' 'POST' '{"productId":"1"}' $C
Write-Host "=== PLACE ORDER ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/orders' 'POST' '{"items":[{"productId":"1","quantity":1}],"deliveryAddress":"42 MG Road","deliveryCity":"Bengaluru","deliveryState":"Karnataka","deliveryPincode":"560001"}' $C
Write-Host "=== INITIATE PAYMENT ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/payments' 'POST' '{"orderId":"1"}' $C
$rnd = Get-Random
$reg = '{"firstName":"Test","lastName":"User","email":"test' + $rnd + '@example.com","password":"Test@1234","phone":"9876543210","addressLine1":"X","city":"X","state":"X","pincode":"560001","country":"IND"}'
Write-Host "=== REGISTER ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/customers/register' 'POST' $reg
Write-Host "=== CHANGE PASSWORD ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/customers/me/password' 'PUT' '{"currentPassword":"Customer@123","newPassword":"Customer@123"}' $C
Write-Host "=== UPDATE CUSTOMER ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/customers/2' 'PUT' '{"firstName":"Priya","lastName":"Sharma","phone":"+91-9876543210","addressLine1":"42 MG Road","city":"Bengaluru","state":"Karnataka","pincode":"560001","country":"IND"}' $C
Write-Host "=== CANCEL ORDER ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/orders/1/cancel' 'PUT' '{}' $C
Write-Host "=== UPDATE ORDER STATUS ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/orders/1/status' 'PUT' '{"status":"SHIPPED"}' $A
Write-Host "=== SUBMIT REVIEW ===" -ForegroundColor Cyan
J 'http://localhost:3000/api/v1/reviews' 'POST' '{"productId":"1","rating":5,"title":"Great","comment":"loved it"}' $C
