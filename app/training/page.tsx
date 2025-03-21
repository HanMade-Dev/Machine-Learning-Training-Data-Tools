"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FileUpload from "@/components/file-upload"
import DataPreview from "@/components/data-preview"
import DataCleaning from "@/components/data-cleaning"
import FeatureLabeling from "@/components/feature-labeling"
import ModelTraining from "@/components/model-training"
import ModelEvaluation from "@/components/model-evaluation"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [cleanedData, setCleanedData] = useState<any[]>([])
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [labeledData, setLabeledData] = useState<any[]>([])
  const [targetColumn, setTargetColumn] = useState<string>("")
  const [model, setModel] = useState<any>(null)
  const [evaluation, setEvaluation] = useState<any>(null)
  const [isLabeled, setIsLabeled] = useState(false)
  const [labelingRules, setLabelingRules] = useState<any>({})

  const nextStep = (tab: string) => {
    setActiveTab(tab)
  }

  const handleSaveModel = () => {
    if (!model) return

    const modelBlob = new Blob([JSON.stringify(model)], { type: "application/json" })
    const modelUrl = URL.createObjectURL(modelBlob)
    const a = document.createElement("a")
    a.href = modelUrl
    a.download = "ml_model.json"
    a.click()
  }

  const handleSaveReport = () => {
    if (!evaluation) return

    const reportContent = `
# Machine Learning Training Report
Date: ${new Date().toLocaleString()}

## Model Information
- Model Type: ${evaluation.modelType}
- Features: ${selectedColumns.filter((col) => col !== targetColumn).join(", ")}
- Target: ${targetColumn}

## Performance Metrics
- Accuracy: ${evaluation.accuracy.toFixed(4)}
- Precision: ${evaluation.precision.toFixed(4)}
- Recall: ${evaluation.recall.toFixed(4)}
- F1 Score: ${evaluation.f1Score.toFixed(4)}

## Confusion Matrix
${evaluation.confusionMatrix.map((row: number[]) => row.join("\t")).join("\n")}
`

    const reportBlob = new Blob([reportContent], { type: "text/plain" })
    const reportUrl = URL.createObjectURL(reportBlob)
    const a = document.createElement("a")
    a.href = reportUrl
    a.download = "ml_training_report.txt"
    a.click()
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Machine Learning Training</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="cleaning">Cleaning</TabsTrigger>
          <TabsTrigger value="labeling">Labeling</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Dataset</CardTitle>
              <CardDescription>Upload CSV or Excel files containing your dataset</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onDataLoaded={(loadedData, loadedColumns) => {
                  setData(loadedData)
                  setColumns(loadedColumns)
                  setCleanedData(loadedData)
                }}
                onNext={() => nextStep("preview")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>Preview your dataset and select columns for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <DataPreview
                data={data}
                columns={columns}
                onColumnsSelected={(cols) => {
                  setSelectedColumns(cols)
                }}
                onNext={() => nextStep("cleaning")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleaning">
          <Card>
            <CardHeader>
              <CardTitle>Data Cleaning</CardTitle>
              <CardDescription>Clean and normalize your data</CardDescription>
            </CardHeader>
            <CardContent>
              <DataCleaning
                data={data}
                selectedColumns={selectedColumns}
                onDataCleaned={(cleaned) => {
                  setCleanedData(cleaned)
                }}
                onNext={() => nextStep("labeling")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labeling">
          <Card>
            <CardHeader>
              <CardTitle>Feature Labeling</CardTitle>
              <CardDescription>Label your data or select target column</CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureLabeling
                data={cleanedData}
                columns={selectedColumns}
                onLabeled={(labeled, target, rules, labeled_status) => {
                  setLabeledData(labeled)
                  setTargetColumn(target)
                  setLabelingRules(rules)
                  setIsLabeled(labeled_status)
                }}
                onNext={() => nextStep("training")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle>Model Training</CardTitle>
              <CardDescription>Configure and train your machine learning model</CardDescription>
            </CardHeader>
            <CardContent>
              <ModelTraining
                data={labeledData}
                columns={selectedColumns}
                targetColumn={targetColumn}
                isLabeled={isLabeled}
                onModelTrained={(trainedModel, evalResults) => {
                  setModel(trainedModel)
                  setEvaluation(evalResults)
                }}
                onNext={() => nextStep("evaluation")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation">
          <Card>
            <CardHeader>
              <CardTitle>Model Evaluation</CardTitle>
              <CardDescription>Review model performance and export results</CardDescription>
            </CardHeader>
            <CardContent>
              {evaluation ? (
                <div>
                  <ModelEvaluation evaluation={evaluation} />

                  <div className="flex justify-end gap-4 mt-8">
                    <Button onClick={handleSaveReport} className="flex items-center gap-2">
                      <Download size={16} />
                      Save Report
                    </Button>
                    <Button onClick={handleSaveModel} className="flex items-center gap-2">
                      <Download size={16} />
                      Save Model
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No evaluation results available. Please complete the training step first.</p>
                  <Button onClick={() => nextStep("training")} className="mt-4">
                    Go to Training
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

