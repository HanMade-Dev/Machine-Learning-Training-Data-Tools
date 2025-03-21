import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import pickle
import json
import base64
import io

def train_model(data_json, algorithm, test_size, random_state, hyperparameters, target_column):
    try:
        data = pd.DataFrame(json.loads(data_json))
        
        X = data.drop(target_column, axis=1)
        y = data[target_column]
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
        model = None
        
        if algorithm == "decision_tree":
            model = DecisionTreeClassifier(
                max_depth=hyperparameters.get("max_depth", 5),
                min_samples_split=hyperparameters.get("min_samples_split", 2),
                random_state=random_state
            )
        elif algorithm == "random_forest":
            model = RandomForestClassifier(
                n_estimators=hyperparameters.get("n_estimators", 100),
                max_depth=hyperparameters.get("max_depth", 5),
                random_state=random_state
            )
        elif algorithm == "svm":
            model = SVC(
                C=hyperparameters.get("C", 1.0),
                kernel=hyperparameters.get("kernel", "rbf"),
                random_state=random_state
            )
        elif algorithm == "knn":
            model = KNeighborsClassifier(
                n_neighbors=hyperparameters.get("n_neighbors", 5)
            )
        elif algorithm == "naive_bayes":
            model = GaussianNB()
        
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        model_buffer = io.BytesIO()
        pickle.dump(model, model_buffer)
        model_base64 = base64.b64encode(model_buffer.getvalue()).decode('utf-8')
        
        result = {
            "success": True,
            "model": model_base64,
            "evaluation": {
                "modelType": algorithm,
                "accuracy": float(accuracy),
                "precision": float(precision),
                "recall": float(recall),
                "f1Score": float(f1),
                "confusionMatrix": cm
            }
        }
        
        return json.dumps(result)
    
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })

def export_model(model_base64, format_type):
    try:
        model_bytes = base64.b64decode(model_base64)
        model = pickle.loads(model_bytes)
        
        if format_type == "pkl":
            return model_bytes
        
        elif format_type == "json":
            model_info = {
                "type": str(type(model).__name__),
                "params": model.get_params()
            }
            return json.dumps(model_info).encode('utf-8')
        
        elif format_type == "xml":
            model_info = {
                "type": str(type(model).__name__),
                "params": model.get_params()
            }
            
            xml_content = '<model>\n'
            xml_content += f'  <type>{model_info["type"]}</type>\n'
            xml_content += '  <parameters>\n'
            
            for param, value in model_info["params"].items():
                xml_content += f'    <{param}>{value}</{param}>\n'
            
            xml_content += '  </parameters>\n'
            xml_content += '</model>'
            
            return xml_content.encode('utf-8')
        
        else:
            return json.dumps({"error": "Unsupported format"}).encode('utf-8')
    
    except Exception as e:
        return json.dumps({"error": str(e)}).encode('utf-8')

