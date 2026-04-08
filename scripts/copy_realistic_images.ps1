$src = "C:\Users\Vipul Bhamare\.gemini\antigravity\brain\1c39d706-1b22-487e-8042-d0477fb9c2b7"
$dst = "C:\Users\Vipul Bhamare\.gemini\antigravity\scratch\smartfarm-app\public"

Copy-Item "$src\realistic_farm_hero_1772548634062.png" "$dst\realistic_farm_hero.png" -Force
Copy-Item "$src\realistic_ai_leaf_1772548654954.png" "$dst\realistic_ai_leaf.png" -Force
Copy-Item "$src\realistic_mandi_market_1772548676463.png" "$dst\realistic_mandi_market.png" -Force
Copy-Item "$src\realistic_soil_test_1772548698593.png" "$dst\realistic_soil_test.png" -Force

Write-Host "All realistic images copied successfully"
