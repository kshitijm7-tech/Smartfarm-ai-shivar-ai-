"""
vision_model.py — Crop Disease Detection via Transfer Learning (MobileNetV2)

Pipeline 1, Segment 1.1 of Smart Farm AI.
Uses the PlantVillage dataset directory structure for training and exports
a reusable `predict_disease()` function for downstream integration.
"""

import os
from typing import Tuple, Dict

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator, load_img, img_to_array
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau


# ──────────────────────────────────────────────
#  Constants
# ──────────────────────────────────────────────
IMG_SIZE: int = 224                    # MobileNetV2 default input size
BATCH_SIZE: int = 32
EPOCHS: int = 5                       # few-epoch fine-tune (adjust as needed)
LEARNING_RATE: float = 1e-4
VALIDATION_SPLIT: float = 0.2
MODEL_SAVE_PATH: str = "crop_disease_model.h5"


# ──────────────────────────────────────────────
#  1. Data Loading
# ──────────────────────────────────────────────
def load_data(
    data_dir: str,
    img_size: int = IMG_SIZE,
    batch_size: int = BATCH_SIZE,
    val_split: float = VALIDATION_SPLIT,
) -> Tuple[tf.keras.preprocessing.image.DirectoryIterator,
           tf.keras.preprocessing.image.DirectoryIterator,
           list]:
    """
    Load images from the PlantVillage-style folder structure.

    Expected layout
    ----------------
    data_dir/
        Apple___Apple_scab/
            img001.jpg …
        Tomato___Late_blight/
            img001.jpg …
        …

    Returns
    -------
    train_gen : DirectoryIterator   – training data generator
    val_gen   : DirectoryIterator   – validation data generator
    class_names : list[str]         – ordered list of class labels
    """
    datagen = ImageDataGenerator(
        rescale=1.0 / 255.0,
        rotation_range=25,
        width_shift_range=0.15,
        height_shift_range=0.15,
        shear_range=0.15,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode="nearest",
        validation_split=val_split,
    )

    train_gen = datagen.flow_from_directory(
        data_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode="categorical",
        subset="training",
        shuffle=True,
    )

    val_gen = datagen.flow_from_directory(
        data_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode="categorical",
        subset="validation",
        shuffle=False,
    )

    class_names: list = list(train_gen.class_indices.keys())
    print(f"[INFO] Found {len(class_names)} classes: {class_names[:5]}{'…' if len(class_names) > 5 else ''}")
    return train_gen, val_gen, class_names


# ──────────────────────────────────────────────
#  2. Model Architecture (Transfer Learning)
# ──────────────────────────────────────────────
def build_model(num_classes: int, img_size: int = IMG_SIZE) -> Model:
    """
    Build a MobileNetV2-based classifier with custom head layers.

    Architecture
    ------------
    MobileNetV2 (frozen base)  →  GlobalAveragePooling  →  Dense 128 (ReLU)
    →  Dropout 0.4  →  Dense num_classes (Softmax)
    """
    base_model = MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=(img_size, img_size, 3),
    )
    base_model.trainable = False          # freeze pre-trained weights

    # Custom classification head
    x = base_model.output
    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.Dense(128, activation="relu", name="fc1")(x)
    x = layers.Dropout(0.4, name="dropout")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = Model(inputs=base_model.input, outputs=outputs, name="CropDiseaseNet")
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()
    return model


# ──────────────────────────────────────────────
#  3. Training Loop
# ──────────────────────────────────────────────
def train_model(
    model: Model,
    train_gen: tf.keras.preprocessing.image.DirectoryIterator,
    val_gen: tf.keras.preprocessing.image.DirectoryIterator,
    epochs: int = EPOCHS,
    save_path: str = MODEL_SAVE_PATH,
) -> tf.keras.callbacks.History:
    """
    Train the model with early stopping & learning-rate reduction.

    Saves the best weights to `save_path` in HDF5 format.
    """
    callbacks = [
        EarlyStopping(
            monitor="val_loss",
            patience=3,
            restore_best_weights=True,
            verbose=1,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=2,
            min_lr=1e-7,
            verbose=1,
        ),
    ]

    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=epochs,
        callbacks=callbacks,
    )

    model.save(save_path)
    print(f"[INFO] Model saved → {os.path.abspath(save_path)}")
    return history


# ──────────────────────────────────────────────
#  4. Prediction (reusable entry-point)
# ──────────────────────────────────────────────
def predict_disease(
    image_path: str,
    model_path: str = MODEL_SAVE_PATH,
    class_names: list | None = None,
) -> Dict[str, object]:
    """
    Load a single image, preprocess it, and return the predicted disease.

    Parameters
    ----------
    image_path  : str          – path to a leaf / crop image
    model_path  : str          – path to the saved .h5 model file
    class_names : list | None  – ordered class labels; when *None* a
                                 generic index is returned instead

    Returns
    -------
    dict with keys:
        "predicted_class" : str   – human-readable disease label
        "confidence"      : float – softmax probability (0-1)
        "all_predictions" : dict  – {class_name: probability}
    """
    # Load model
    model: Model = tf.keras.models.load_model(model_path)

    # Preprocess image
    img = load_img(image_path, target_size=(IMG_SIZE, IMG_SIZE))
    img_array: np.ndarray = img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)       # (1, 224, 224, 3)

    # Predict
    predictions: np.ndarray = model.predict(img_array)[0]
    predicted_idx: int = int(np.argmax(predictions))
    confidence: float = float(predictions[predicted_idx])

    # Map indices → labels
    if class_names is None:
        class_names = [f"class_{i}" for i in range(len(predictions))]

    predicted_label: str = class_names[predicted_idx]
    all_predictions: Dict[str, float] = {
        class_names[i]: float(predictions[i]) for i in range(len(predictions))
    }

    result: Dict[str, object] = {
        "predicted_class": predicted_label,
        "confidence": round(confidence, 4),
        "all_predictions": all_predictions,
    }

    print(f"[RESULT] {predicted_label}  (confidence: {confidence:.2%})")
    return result


# ──────────────────────────────────────────────
#  5. Main — full training pipeline
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train Crop Disease Classifier")
    parser.add_argument("--data_dir", type=str, required=True,
                        help="Path to PlantVillage dataset root folder")
    parser.add_argument("--epochs", type=int, default=EPOCHS,
                        help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=BATCH_SIZE,
                        help="Training batch size")
    parser.add_argument("--save_path", type=str, default=MODEL_SAVE_PATH,
                        help="Output path for the .h5 model file")
    args = parser.parse_args()

    # ── Pipeline ──
    train_gen, val_gen, class_names = load_data(
        data_dir=args.data_dir,
        batch_size=args.batch_size,
    )

    model = build_model(num_classes=len(class_names))

    history = train_model(
        model,
        train_gen,
        val_gen,
        epochs=args.epochs,
        save_path=args.save_path,
    )

    # Quick sanity check on validation set
    val_loss, val_acc = model.evaluate(val_gen)
    print(f"[EVAL] Validation Loss: {val_loss:.4f}  |  Validation Accuracy: {val_acc:.4f}")
