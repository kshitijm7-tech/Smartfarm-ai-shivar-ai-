from real_land_segmenter import predict_land_area
from strategic_inference import suggest_optimal_crop
import json
import os

def run_farm_strategy(
    image_path: str,
    total_hectares: float,
    env_data: dict,
    max_budget: float,
    model_path: str = 'crop_recommender.pkl'
) -> str:
    """
    Master function that integrates the land segmentation and
    budget-constrained crop recommendation pipeline.
    
    Args:
        image_path (str): Path to the satellite image.
        total_hectares (float): Total size of the farm in hectares.
        env_data (dict): Dictionary with 'N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'.
        max_budget (float): Maximum allowed budget in INR.
        model_path (str): Path to the trained RandomForest logic model.
        
    Returns:
        str: JSON mapping of the entire unified strategy result.
    """
    
    if model_path == 'crop_recommender.pkl':
        model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'crop_recommender.pkl')
        
    # Step 1: Segmentation for Usable Land Area
    print(f"[Model 2 Pipeline] Step 1: Running U-Net Segmentation on {image_path}...")
    try:
        segmentation_results = predict_land_area(image_path, total_hectares)
        usable_hectares = segmentation_results['usable_hectares']
        print(f"   -> Usable Arable Land Found: {usable_hectares} Ha out of {total_hectares} Ha")
    except Exception as e:
        return json.dumps({
            "status": "error",
            "step_failed": "image_segmentation",
            "message": str(e)
        }, indent=4)

    # Step 2: Crop Recommendation with Budget Optimization
    print(f"[Model 2 Pipeline] Step 2: Predicting Optimal Crop with INR {max_budget} budget...")
    try:
        inference_results = suggest_optimal_crop(
            usable_hectares=usable_hectares,
            env_data_dict=env_data,
            max_budget_inr=max_budget,
            model_path=model_path
        )
        return inference_results
    except Exception as e:
         return json.dumps({
            "status": "error",
            "step_failed": "strategic_inference",
            "message": str(e)
        }, indent=4)
        

if __name__ == "__main__":
    # Simulate an end-to-end execution
    print("=== Testing the Unified Strategy Pipeline ===")
    
    import numpy as np
    import cv2
    
    # 1. Generate a dummy satellite image
    dummy_img_path = "test_farm_satellite.jpg"
    if not os.path.exists(dummy_img_path):
        dummy_image = np.random.randint(0, 255, (256, 256, 3), dtype=np.uint8)
        cv2.imwrite(dummy_img_path, dummy_image)
        
    # 2. Mock inputs
    mock_total_hectares = 10.0
    mock_env_data = {
        'N': 110, 'P': 45, 'K': 50, 
        'temperature': 25.5, 'humidity': 75.0, 
        'ph': 6.8, 'rainfall': 180.0
    }
    mock_max_budget = 400000  # 4 Lakh INR
    
    try:
        # Run the unified pipeline
        final_strategy_json = run_farm_strategy(
            image_path=dummy_img_path,
            total_hectares=mock_total_hectares,
            env_data=mock_env_data,
            max_budget=mock_max_budget
        )
        
        print("\n=== Final Strategy Output ===")
        print(final_strategy_json)
        
    finally:
        # Cleanup
        if os.path.exists(dummy_img_path):
            os.remove(dummy_img_path)
