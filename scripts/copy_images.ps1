$src = "C:\Users\Vipul Bhamare\.gemini\antigravity\brain\1c39d706-1b22-487e-8042-d0477fb9c2b7"
$dst = "C:\Users\Vipul Bhamare\.gemini\antigravity\scratch\smartfarm-app\public"

Copy-Item "$src\farm_banner_1772545763212.png" "$dst\farm_banner.png" -Force
Copy-Item "$src\crop_wheat_1772545812151.png" "$dst\crop_wheat.png" -Force
Copy-Item "$src\crop_tomato_1772545828234.png" "$dst\crop_tomato.png" -Force
Copy-Item "$src\crop_sugarcane_1772545843937.png" "$dst\crop_sugarcane.png" -Force
Copy-Item "$src\farmer_avatar_1772545864425.png" "$dst\farmer_avatar.png" -Force

Write-Host "All images copied successfully"
