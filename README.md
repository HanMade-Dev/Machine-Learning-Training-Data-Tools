# 🤖 Machine Learning Training Platform

A comprehensive web-based platform for training, evaluating, and deploying machine learning models without writing code. This tool simplifies the entire machine learning workflow from data upload to model deployment.

## 📜 Overview

The Machine Learning Training Platform is an end-to-end solution designed to democratize machine learning by providing a user-friendly interface for the complete ML workflow. It allows users to upload datasets, clean and preprocess data, select features, train various ML models, evaluate performance, and make predictions—all through an intuitive web interface.

Built with Next.js and scikit-learn, this platform bridges the gap between data science expertise and practical application, making machine learning accessible to users with varying levels of technical knowledge.

## ✨ Features

- **Data Upload**: Upload your data in CSV format.
- **Data Preview**: Preview your data and select relevant columns.
- **Data Cleaning**: Handle missing values and outliers.
- **Feature Labeling**: Define features and target variables.
- **Model Training**: Train various ML models (e.g., Logistic Regression, SVM, Random Forest).
- **Model Evaluation**: Evaluate model performance using metrics like accuracy, precision, and recall.
- **Model Export**: Export trained models for future use.

## 🛠️ Technologies Used

- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Python (scikit-learn, pandas, imbalanced-learn)
- **Data Processing**: pandas, scikit-learn
- **Model Serialization**: pickle, JSON, XML

## 📦 Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/yourusername/ml-training-platform.git
   cd ml-training-platform
   \`\`\`

2. **Install frontend dependencies:**
   \`\`\`bash
   cd app
   npm install
   \`\`\`

3. **Install backend dependencies:**
   \`\`\`bash
   cd api
   pip install -r requirements.txt
   \`\`\`

4. **Run the application:**
   \`\`\`bash
   # In the app directory
   npm run dev

   # In the api directory
   python ml_backend.py
   \`\`\`

   Make sure your Python backend is running before starting the Next.js frontend.

## 💻 Usage

1. Open your browser and navigate to `http://localhost:3000`.
2. Upload your CSV dataset.
3. Preview the data and select the columns you want to use.
4. Clean the data by handling missing values and outliers.
5. Define your features and target variable.
6. Select a model and train it.
7. Evaluate the model's performance.
8. Export the trained model.

## 📝 Contributing

We welcome contributions! Here's how you can contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes.
4. Submit a pull request.

## 🙏 Acknowledgements

- This project was inspired by the need for an accessible ML training platform.
- Special thanks to the open-source community for providing the tools and libraries used in this project.

## 🔧 Troubleshooting

### Common Issues

- **Python Dependencies Error**: If you encounter issues with Python dependencies, try creating a virtual environment:
  \`\`\`bash
  python -m venv venv
  source venv/bin/activate  # On Windows: venv\Scripts\activate
  pip install scikit-learn numpy imbalanced-learn
  \`\`\`

- **Memory Issues with Large Datasets**: For large datasets, try:
  - Increasing Node.js memory: `NODE_OPTIONS=--max_old_space_size=4096 npm run dev`
  - Using data sampling in the cleaning step
  - Processing data in smaller batches

- **Browser Compatibility**: This application works best in Chrome, Firefox, and Edge. If you experience issues:
  - Clear browser cache
  - Disable browser extensions that might interfere with the application

- **Hydration Errors**: If you see React hydration errors in the console:
  - Disable browser extensions like Grammarly
  - Clear your browser cache
  - Try using incognito/private browsing mode

## ❓ FAQ

### General Questions

**Q: Can I use this platform for production ML models?**  
A: While the platform is capable of training real models, it's primarily designed for educational and prototyping purposes. For production deployments, consider additional testing and validation.

**Q: What size datasets can this platform handle?**  
A: The platform works best with datasets up to ~100,000 rows and ~100 columns. Larger datasets may require additional system resources or preprocessing.

**Q: Does this support deep learning models?**  
A: Currently, the platform focuses on traditional machine learning algorithms. Deep learning support is on our roadmap for future development.

**Q: Can I save my work and continue later?**  
A: The current version doesn't support saving sessions. We recommend completing your workflow in one session or exporting intermediate results.

### Technical Questions

**Q: How are models stored?**  
A: Models are serialized using Python's pickle library. When exported, you can choose between pickle, JSON, or XML formats.

**Q: Is my data secure?**  
A: All data processing happens locally in your browser and on your machine. No data is sent to external servers.

**Q: Can I deploy trained models as APIs?**  
A: This feature is not currently available but is on our roadmap for future development.

## 📂 Project Structure

\`\`\`
ml-training-platform/
├── app/                    # Next.js app directory
│   ├── api/                # API routes for model training and prediction
│   ├── page.tsx            # Main application page
│   └── layout.tsx          # Application layout
├── components/             # React components
│   ├── file-upload.tsx     # File upload component
│   ├── data-preview.tsx    # Data preview and column selection
│   ├── data-cleaning.tsx   # Data cleaning tools
│   ├── feature-labeling.tsx # Feature labeling component
│   ├── model-training.tsx  # Model training interface
│   ├── model-evaluation.tsx # Model evaluation and visualization
│   └── about-modal.tsx     # About information modal
├── lib/                    # Utility functions
│   └── ml-utils.ts         # ML helper functions
├── public/                 # Static assets
└── api/                    # Python backend
    └── ml_backend.py       # Python ML processing script
\`\`\`


## ⚡ Performance Tips

- **Data Preprocessing**: Clean and normalize your data before uploading for better performance
- **Feature Selection**: Limit the number of features to improve training speed
- **Sampling**: For large datasets, consider using a representative sample
- **Hardware Acceleration**: Ensure your browser has hardware acceleration enabled for better visualization performance

## 👥 Community and Support

- **GitHub Issues**: Report bugs or request features through [GitHub Issues]([https://github.com/HanMade-Dev/Machine-Learning-Training-Data-Tools/issues)
- **Discussions**: Join discussions about the platform on [GitHub Discussions]([https://github.com/HanMade-Dev/Machine-Learning-Training-Data-Tools/discussions)
- **Contributing**: See the [Contributing](#-contributing) section for how to get involved
- **Contact**: Reach out to the maintainers at [farhan12nbl@gmail.com](mailto:farhan12nbl@gmail.com)

## 📊 Case Studies

### Educational Use Case
The platform has been successfully used in university data science courses to help students understand the ML workflow without getting bogged down in code details.

### Business Analytics Use Case
Small business analysts have used this tool to quickly prototype ML models for customer segmentation and churn prediction without requiring specialized data science expertise.

### Research Use Case
Researchers in non-computer science fields have utilized the platform to apply ML techniques to their domain-specific data, accelerating interdisciplinary research.

