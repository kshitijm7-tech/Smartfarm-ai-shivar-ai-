import json
from graders import get_grader
from tasks import list_tasks, get_task

print("TESTING GRADERS:")

# Grader 1
task1 = get_task('soil_health_report')
g1 = get_grader(task1['grader'])
print("G1 empty:", g1("", [], [], task1))
print("G1 perfect:", g1("nitrogen phosphorus potassium ph moisture health score recommend fertilizer", ["analyze_soil"], [], task1))

# Grader 2
task2 = get_task('crop_selection')
g2 = get_grader(task2['grader'])
print("G2 empty:", g2("", [], [], task2))
print("G2 perfect:", g2("soil nitrogen risk rain recommend because profit cost budget", ["analyze_soil", "assess_risk", "recommend_crop"], [], task2))

# Grader 3
task3 = get_task('full_farm_plan')
g3 = get_grader(task3['grader'])
print("G3 empty:", g3("", [], [], task3))
print("G3 perfect:", g3("soil nitrogen crop recommend select disease fungicide risk weather mitigation protect profit budget cost apply use kg days", ["analyze_soil", "check_disease", "recommend_crop", "assess_risk"], [], task3))
