from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import ml_training
import json
import io

app = Flask(__name__)
CORS(app)

@app.route('/api/train', methods=['POST'])
def train():
    try:
        data = request.json
        
        result = ml_training.train_model(
            data_json=json.dumps(data['data']),
            algorithm=data['algorithm'],
            test_size=data['testSize'],
            random_state=data['randomState'],
            hyperparameters=data['hyperparameters'],
            target_column=data['targetColumn']
        )
        
        return result
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/export', methods=['POST'])
def export():
    try:
        data = request.json
        model_base64 = data['model']
        format_type = data['format']
        
        model_bytes = ml_training.export_model(model_base64, format_type)
        
        file_extension = ".pkl"
        mimetype = "application/octet-stream"
        
        if format_type == "json":
            file_extension = ".json"
            mimetype = "application/json"
        elif format_type == "xml":
            file_extension = ".xml"
            mimetype = "application/xml"
        
        return send_file(
            io.BytesIO(model_bytes),
            mimetype=mimetype,
            as_attachment=True,
            download_name=f"ml_model{file_extension}"
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

