from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
from imblearn.over_sampling import SMOTE
import numpy as np
import json
import sys
import pickle
import base64
import os

def train_model(data):
    try:
        X = np.array(data['X'])
        y_raw = data['y']
        algorithm = data['algorithm']
        hyperparameters = data['hyperparameters']
        test_size = data['testSize']
        random_state = data['randomState']
        use_oversampling = data.get('useOversampling', False)
        
        # Check if target is categorical (string)
        is_categorical = any(isinstance(val, str) for val in y_raw)
        
        # Encode categorical target variables
        if is_categorical:
            label_encoder = LabelEncoder()
            y = label_encoder.fit_transform(y_raw)
            class_names = label_encoder.classes_.tolist()
        else:
            y = np.array(y_raw)
            class_names = sorted(list(set(y_raw)))
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
        # Apply oversampling if requested
        if use_oversampling and len(np.unique(y_train)) > 1:
            try:
                smote = SMOTE(random_state=random_state)
                X_train, y_train = smote.fit_resample(X_train, y_train)
            except Exception as e:
                print(f"Warning: Oversampling failed: {str(e)}. Continuing with original data.")
        
        # Train model based on algorithm
        model = None
        
        if algorithm == 'decision_tree':
            model = DecisionTreeClassifier(
                max_depth=hyperparameters['max_depth'],
                min_samples_split=hyperparameters['min_samples_split'],
                random_state=random_state
            )
        elif algorithm == 'random_forest':
            model = RandomForestClassifier(
                n_estimators=hyperparameters['n_estimators'],
                max_depth=hyperparameters['max_depth'],
                random_state=random_state
            )
        elif algorithm == 'svm':
            model = SVC(
                C=hyperparameters['C'],
                kernel=hyperparameters['kernel'],
                random_state=random_state,
                probability=True
            )
        elif algorithm == 'knn':
            model = KNeighborsClassifier(
                n_neighbors=hyperparameters['n_neighbors']
            )
        elif algorithm == 'naive_bayes':
            model = GaussianNB()
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        # Fit model
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        
        # For binary classification
        if len(np.unique(y)) == 2:
            precision = precision_score(y_test, y_pred, zero_division=0)
            recall = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
        else:
            # For multiclass, use weighted average
            precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        # Calculate confusion matrix
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        # Get detailed classification report
        class_report = classification_report(y_test, y_pred, target_names=[str(c) for c in class_names], output_dict=True)
        
        # Get feature importance if available
        feature_importance = []
        if hasattr(model, 'feature_importances_'):
            feature_importance = model.feature_importances_.tolist()
        elif algorithm == 'svm' and hasattr(model, 'coef_'):
            # For linear SVM
            feature_importance = abs(model.coef_[0]).tolist() if len(model.coef_.shape) > 1 else abs(model.coef_).tolist()
        else:
            # For algorithms without native feature importance
            feature_importance = [0] * X.shape[1]
        
        # Serialize the model
        model_path = os.path.join(os.path.dirname(__file__), 'temp_model.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        # Read the serialized model
        with open(model_path, 'rb') as f:
            serialized_model = base64.b64encode(f.read()).decode('utf-8')
        
        # Clean up
        if os.path.exists(model_path):
            os.remove(model_path)
        
        # Prepare model data for frontend
        model_data = {
            'coefficients': feature_importance,
            'intercept': model.intercept_.tolist() if hasattr(model, 'intercept_') else [0],
            'featureImportance': feature_importance,
            'serializedModel': serialized_model,
            'classNames': class_names
        }
        
        # Prepare evaluation data
        evaluation = {
            'modelType': algorithm,
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1Score': float(f1),
            'confusionMatrix': cm,
            'classNames': class_names,
            'classReport': class_report
        }
        
        return {
            'success': True,
            'model': model_data,
            'evaluation': evaluation
        }
    
    except Exception as e:
        import traceback
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }

# Add a prediction function
def predict(data):
    try:
        model_data = base64.b64decode(data['serializedModel'])
        new_data = np.array(data['newData'])
        
        # Load the model
        model = pickle.loads(model_data)
        
        # Make predictions
        predictions = model.predict(new_data)
        
        # Get probabilities if available
        probabilities = []
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(new_data).tolist()
        
        return {
            'success': True,
            'predictions': predictions.tolist(),
            'probabilities': probabilities
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == "__main__":
    input_data = json.loads(sys.stdin.read())
    
    # Check if this is a prediction request
    if 'action' in input_data and input_data['action'] == 'predict':
        result = predict(input_data)
    else:
        # Default to training
        result = train_model(input_data)
    
    print(json.dumps(result))

